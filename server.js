/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */


const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const admin = require("firebase-admin");
const express = require('express');
const bodyParser = require("body-parser");
let playground = require("./routes/playground");
const multiplayer = require('./routes/multiplayer');
const question = require('./routes/questions');
const Auth = require('./routes/Auth');
const play = require('./routes/play');
const Admin = require('./routes/admin');
const Scoreboard = require('./routes/scoreboard');
const Socket = require('./routes/Sockets');
const path = require("path");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cookie = require('cookie');

// Page port
const port = 3000;
const socketObject = new Socket();

// Firebase admin key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize firebase admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://double-d713e-default-rtdb.firebaseio.com"
});

// Initialize csrf token
const csrfMiddleware = csrf({ cookie: true });

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrfMiddleware);

// Set csrf token to all pages cookies
app.all("*", (req, res, next) => {
    res.cookie("XSRF-TOKEN", req.csrfToken());
    next();
});

// Get Index page (Homepage)
app.get('/', (req, res) => {
    // Check if the user is logged in
    Auth.checkIfUserIsLoggedIn(req,(data) => {
        // Redirect user to play page
        res.redirect('/play');
    }
    , (err) => {
        // if the user is not logged in redirect into index page
        res.status(200).render('index', {
            name: '',
            email: '',
            admin: false,
            user_loggedIn: false
        });
    })
})

// Authentication router
app.use('/', Auth.router);

// Multiplayer router
app.use('/multiplayer', multiplayer.router);

// Playground router
app.use('/playground', playground);

// Questions router
app.use('/questions', question.router);

// Play router
app.use('/play', play);

// Admin router
app.use('/admin', Admin);

// Scoreboard router
app.use('/scoreboard', Scoreboard)

app.get('*', (req, res) => {
    Auth.checkIfUserIsLoggedIn(req,(user) => {
            // Redirect user to play page
            res.status(404).render('404', {
                name: user.name,
                uid: user.uid,
                user_loggedIn: true,
                admin: user.extra.admin
            })
        }
        , (err) => {
            // if the user is not logged in redirect into index page
            res.status(404).render('404', {
                name: '',
                email: '',
                admin: false,
                user_loggedIn: false
            });
        })
});

// Player 1 = requester - Player2 = requested

// Start socket.io connection
io.on('connection', socket => {
    // User online
    socket.on('online', user_id => {
        // Update user status on firebase
        Auth.updateUserStatus(1, user_id)
        // Push user as online
        socketObject.PushOnlineUser(user_id, socket.id);
        // Sent to all connected user the number of active players
        io.emit('online_players', socketObject.GetNumberOfOnlinePlayers());
        // send the available players to play multiplayer
        socketObject.GetOnlinePlayers()
            .then(data => {
                // Send data to all
                io.emit('available_players', data);
            })
    })

    // Invite player to play multiplayer ( Player1 requests Player2 )
    socket.on('invite_player', data => {
        // Get invited user socket_id
        let socket_id = socketObject.GetSocketIDByUserID(data.user_id);
        // Check if socket_id exists (online)
        if(socket_id.length > 0) {
            // Create multiplayer session to start game
            multiplayer.createSession(data.current_user_id, data.user_id).then(async session_id => {
                // Push session as pending game
                await socketObject.PushMultiplayerSession(session_id, data.current_user_id, data.user_id)
                // Inform user that session is ready (Player1)
                socket.emit('session_created', session_id);
                // Find all active sockets of player
                for(let i = 0; i < socket_id.length; i++) {
                    // Get invited user's (Player2) socket to send data
                    let socketById = io.sockets.sockets.get(socket_id[i]);
                    if(socketById) {
                        // Invite opponent (Player2)
                        socketById.emit("invite", {
                            name: await socketObject.GetOpponentName(session_id, data.current_user_id),
                            session_id: session_id
                        })
                    }
                }
            });
        }
    });

    // Get rejection from user
    socket.on('reject_invitation', async data => {
        // Get opponent
        let opponent_id = await socketObject.GetOpponentUserID(data.session_id, data.user_id);
        // Get socked id from opponent id
        let socket_id = socketObject.GetSocketIDByUserID(opponent_id);
        // Check if socket id exists
        if (socket_id.length > 0) {
            // Go through each socket
            for (let i = 0; i < socket_id.length; i++) {
                // Get opponent user socket id
                let socketById = io.sockets.sockets.get(socket_id[i]);
                if (socketById) {
                    // Inform user (Player1) that (Player2) rejected the invitation
                    socketById.emit("user_reject_invitation", {
                        session_id: data.session_id,
                        name: await socketObject.GetOpponentName(data.session_id, data.user_id)
                    })
                }
            }
        }
    })

    // Player2 joined the session
    socket.on('user_join_session', async data => {
        // Get user (Player2) user_id and session_id
        let user_id = data.user_id;
        let session_id = data.session_id;

        // Update firebase set the game to active
        multiplayer.playerJoin(user_id, session_id);
        socketObject.UpdateUserMultiplayerStatus(session_id, user_id, 'join')

        // Get opponent (Player1 user_id)
        let opponent_id = await socketObject.GetOpponentUserID(session_id, user_id);
        // Get opponent (Player1) socket_id
        let socket_id = socketObject.GetSocketIDByUserID(opponent_id);
        // Check if socket_id exists
        if (socket_id.length > 0) {
            for (let i = 0; i < socket_id.length; i++) {
                // Get socket of opponent (Player1)
                let socketById = io.sockets.sockets.get(socket_id[i]);
                if (socketById) {
                    // Send to Player1 tha user (Player2) joined the session
                    socketById.emit('opponent_joined', {
                        name: socketObject.data.multiplayer[session_id][user_id].name,
                        session_id: session_id
                    });
                }
            }
        }
    })

    // Player1 starts the game
    socket.on('game_started', async (session_id) => {
        // Get PLayer1 id
        let user_id = socketObject.GetUserIDBySocketID(socket.id);
        // Get opponent (Player2)
        let opponent_id = await socketObject.GetOpponentUserID(session_id, user_id);
        // Get Player2 id & socket
        let socket_id = socketObject.GetSocketIDByUserID(opponent_id);
        // Check if Player2 socket exists (online)
        if (socket_id.length > 0) {
            // Set countdown
            let secondToStart = 15;
            // Start countdown
            let before = setInterval(async () => {
                secondToStart--;
                // Sent player1 countdown
                socket.emit('countdown', {
                    countdown: secondToStart,
                    session_id: session_id
                });
                // Loop to find all socket id's for the user
                for (let i = 0; i < socket_id.length; i++) {
                    let socketById = io.sockets.sockets.get(socket_id[i]);
                    if (socketById) {
                        // Sent player2 countdown
                        socketById.emit('countdown', {
                            countdown: secondToStart,
                            session_id: session_id
                        });
                    }
                }

                // Check if countdown finishes
                if (secondToStart === -1) {
                    // Stop looping
                    clearInterval(before);
                    // Start game for Player1
                    socket.emit('start_game', {
                        session_id: session_id
                    });
                    // Sent Player1 scores
                    socket.emit('score', {
                        session_id: session_id,
                        score: await socketObject.GetSessionScores(session_id)
                    })
                    // Loop to find all socket id's for the user
                    for (let i = 0; i < socket_id.length; i++) {
                        let socketById = io.sockets.sockets.get(socket_id[i]);
                        if (socketById) {
                            socketById.emit('start_game', {
                                session_id: session_id
                            });
                            // Sent Player2 scores
                            socketById.emit('score', {
                                session_id: session_id,
                                score: await socketObject.GetSessionScores(session_id)
                            })
                        }
                    }


                    // Set game's countdown to 15 minutes
                    let minute = 14;
                    let sec = 59;
                    let interval = setInterval(async function () {
                        socket.emit('time_left', {
                            time: minute + ":" + sec,
                            session_id: session_id
                        });
                        for (let i = 0; i < socket_id.length; i++) {
                            let socketById = io.sockets.sockets.get(socket_id[i]);
                            if (socketById) {
                                socketById.emit('time_left', {
                                    time: minute + ":" + sec,
                                    session_id: session_id
                                });
                            }
                        }
                        // Decrease seconds
                        sec--;
                        // Check if seconds are less than 0
                        if (sec == -1) {
                            // Decrease minutes
                            minute--;
                            // Set Seconds to 59
                            sec = 59;
                            // Check if minute is less than 0
                            if (minute == -1) {
                                // Stop game
                                // Sent to Player1 that the game is over
                                socket.emit('game_over', {
                                    session_id: session_id
                                });
                                for (let i = 0; i < socket_id.length; i++) {
                                    let socketById = io.sockets.sockets.get(socket_id[i]);
                                    // Sent to Player2 that the game is over
                                    if (socketById) {
                                        socketById.emit('game_over', {
                                            session_id: session_id
                                        });
                                    }
                                }
                                // Inform database that session is closed
                                socketObject.UpdateSessionStatus(session_id, 'done');
                                multiplayer.closeSession(session_id, await socketObject.GetSessionData(session_id));
                                socketObject.DestroySession(session_id);
                                clearInterval(interval);
                            }
                        }

                    }, 1000);
                }
            }, 1000)

        }
    })
    // Update score for both users
    socket.on('update_score', async data => {
        // Get session id from data retrieved from request
        let session_id = data.session_id;
        // Get user id from socket
        let user_id = data.user_id;
        socketObject.UpdateUserScore(session_id, user_id, null, true);
        // Get score for both users
        let score = await socketObject.GetSessionScores(session_id);
        // Get user's ID Player1 / Player2
        let opponent_id = await socketObject.GetOpponentUserID(session_id, user_id);
        // Get opponent user id
        let socket_id = socketObject.GetSocketIDByUserID(opponent_id);
        // Check if socket exists
        if (socket_id.length > 0) {
            for (let i = 0; i < socket_id.length; i++) {
                // Initialise socket with socket id
                let socketById = io.sockets.sockets.get(socket_id[i]);
                // Sent score to both users
                if (socketById) {
                    socketById.emit('score', {
                        score: score,
                        session_id: session_id
                    });
                }
            }
        }
        // Sent score to both users
        socket.emit('score', {
            score: score,
            session_id: session_id
        });
    })

    // Create chat session for both users
    socket.on('live_chat', async data => {
        // Get the id of the user that requests
        let user_id = data.user_id;
        // Get the session id of the user that requests
        let session_id = data.session_id;
        // Get opponents user id
        let opponent_id = await socketObject.GetOpponentUserID(session_id, user_id);
        let socket_id = socketObject.GetSocketIDByUserID(opponent_id);
        // Check if socket exists
        if (socket_id.length > 0) {
            for (let i = 0; i < socket_id.length; i++) {
                let socketById = io.sockets.sockets.get(socket_id[i]);
                // Sent chat data to opponent
                if (socketById) {
                    socketById.emit('chat_response', {
                        msg: data.msg,
                        session_id: session_id
                    });
                }
            }
        }
    })

    // Disconnect user from socket
    socket.on('disconnect', async () => {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        // Get users url when disconnected
        let url = new URL(socket.request.headers.referer)
        // Check if user was in session before terminate
        if (url.pathname === '/multiplayer/session') {
            // Get user id by socket
            let user_id = socketObject.GetUserIDBySocketID(socket.id)
            // Get session id by user id
            let session_id = cookies.session_id;
            if (session_id) {
                // Delete user's score
                socketObject.UpdateUserScore(session_id, user_id, 0, false);
                // Get opponent's user id
                let opponent_id = await socketObject.GetOpponentUserID(session_id, user_id);
                // Get opponents socket id
                let socket_id = socketObject.GetSocketIDByUserID(opponent_id);
                // Check if socket exists
                if (socket_id.length > 0) {
                    for (let i = 0; i < socket_id.length; i++) {
                        // Initialise socket with socket id
                        let socketById = io.sockets.sockets.get(socket_id[i]);
                        // Initialise player with user id

                        // Inform opponent that session was destroyed
                        if (socketById) {
                            socketById.emit('session_destroy', {
                                session_id: session_id,
                                name: await socketObject.GetOpponentName(session_id, user_id),
                                score: await socketObject.GetSessionScores(session_id)
                            });

                            // Close game
                            socketById.emit('game_over', {
                                session_id: session_id
                            });
                        }
                    }
                }

                // Update database -> Set session's status "done"
                socketObject.UpdateSessionStatus(session_id, 'done');
                multiplayer.closeSession(session_id, await socketObject.GetSessionData(session_id));
                // Delete session
                socketObject.DestroySession(session_id);
            }

        }


        // Update users status to offline
        Auth.updateUserStatus(0, socketObject.GetUserIDBySocketID(socket.id))
        // Delete user from socket json
        socketObject.RemoveUser(socket.id);
        // Remove user from online players
        io.emit('online_players', socketObject.GetNumberOfOnlinePlayers());
        // Get online players
        socketObject.GetOnlinePlayers()
            .then(data => {
                // Sent online players
                io.emit('available_players', data);
            })

    })
})

// Start server at http://localhost:{port}
http.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
