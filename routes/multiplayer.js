const express = require('express');
const router = express.Router();

let firebase = require('./database');
let Auth = require("./Auth")
const {getDatabase, ref, push, set, child, get, update, limitToLast, query} = require("firebase/database");
const questions = require("./questions");
const moment = require('moment');

const db = getDatabase(firebase);

// Render multiplayer scene
router.get('/', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        // If logged in status 200 - sent name, uid, admin, user logged true
        res.status(200).render('multiplayer', {
            name: user.name,
            uid: user.uid,
            admin: user.extra.admin,
            user_loggedIn: true
        });
    }
    // If user not logged in redirect to homepage
    , () => {
        res.redirect('/');
    })
})

// Render multiplayer game
router.get('/play/:ID', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req, (user) => {
            // Check if tasks are not undefined
            if (req.params.ID !== undefined) {
                // Get questions from question ID param
                questions.getQuestion(req.params.ID).then(r => {
                    // status 200 - Sent name, uid, question, loggedIn, admin
                    res.status(200).render('multiplayer_game', {
                        name: user.name,
                        uid: user.uid,
                        questions: r,
                        user_loggedIn: true,
                        id: req.params.ID,
                        admin: user.extra.admin
                    });
                }).catch(err => {
                    // Question error
                    res.redirect('/404');
                })
            } else {
                // 404 error page
                res.redirect('/404');
            }
        }
        , () => {
            // If user not logged in redirect to homepage
            res.redirect('/');
        })
})

// Update Users scores
router.post('/done', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        getSession(req.body.session_id).then(data => {
            let index = data.questions.indexOf(req.body.key);
            res.status(200).json({
                next: data.questions[index + 1],
            })
        }).catch(err => {
            // Next Question error
            res.status(err.status).json(err.error);
        })

    }, () => {
        // If user not logged in status 403 - authentication
        res.status(403).json({
            error: "Require Authentication"
        })
    });
})

// Render lobby page
router.get('/session', (req, res) => {
    let session_id = req.query.id;
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        // Get game session id
        getSession(session_id).then(question => {
            // Check if status is active
            if (question.status === 'active' && question[user.uid].status !== 'join') {
                let opponent_id;
                // Find opponent
                if (question.users.player1 === user.uid) {
                    opponent_id = question.users.player2
                } else {
                    opponent_id = question.users.player1;
                }
                // Get opponent id
                getPlayer(opponent_id).then(player => {
                    let enemy_name = player.name;
                    // Find requester id
                    let creator = (question.users.player1 === user.uid);
                    // Status 200 - sent data
                    res.status(200).render('lobby', {
                        name: user.name,
                        uid: user.uid,
                        id: user.uid,
                        creator: creator,
                        session_id: session_id,
                        admin: user.extra.admin,
                        enemy: enemy_name,
                        user_loggedIn: true,
                        question: question.questions[0]
                    })
                })
            } else {
                // If question not active - redirect to homepage
                res.redirect('/');
            }
        }).catch(err => {
            // Error 404
            res.redirect('/404')
        })
    }, () => {
        // If user not logged in redirect to homepage
        res.redirect('/');
    })
})

// Get games board for both users
router.get('/games', (req, res) => {
    // Check if User is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        const dbRef = ref(getDatabase());
        // Get last 10 games played
        get(query(child(dbRef, `users/${user.uid}/games`), limitToLast(10))).then(async (snapshot) => {
            let userGames = snapshot.val();

            let response = [];
            // Push session details
            for (let key in userGames) {
                let game = userGames[key].session_id;
                await get(child(dbRef, `multiplayer/${game}`))
                    .then((snapshot) => {
                        if(snapshot.exists()) {
                            let snap = snapshot.val();
                            snap['createdAt'] = moment(snap['createdAt']).format('DD/MM/YYYY hh:mm:ss')
                            response.push(snap);
                        }

                    }).catch((error) => {
                        // Firebase error
                        res.status(500).json({
                            status: 500,
                            res: error
                        })
                    })
            }
            // Status 200 - Sent list of last 10 games played
            res.status(200).json(response.reverse());
        }).catch((error) => {
            res.status(500).json({
                status: 500,
                res: error
            })
        });


    }, () => {
        // Check if user is not logged in
        res.status(403).json({
            status: 403,
            res: 'User not logged in'
        })
    })

});

// Insert session to Firebase
async function createSession(user1, user2) {
    const len = await questions.getQuestionsLength();
    const postListRef = ref(db, `multiplayer`);
    const newPostRef = push(postListRef);
    let date = new Date();
    let data = {
        status: 'active',
        created: date.getTime(),
        users: {
            player1: user1,
            player2: user2
        },
        questions: []
    }


    for(let i = 0; i < len; i++) {
        data.questions.push(i);
    }

    data.questions = shuffle(data.questions);

    // todo remove
    const yourArray = data.questions;

    let duplicates = []

    const tempArray = [...yourArray].sort()

    for (let i = 0; i < tempArray.length; i++) {
        if (tempArray[i + 1] === tempArray[i]) {
            duplicates.push(tempArray[i])
        }
    }

    console.log(duplicates);

    data[user1] = {
        status: 'pending'
    }

    data[user2] = {
        status: 'pending'
    }
    await set(newPostRef, data).then(d => {
        // Assign session id to users games
        addUserSession(user1, newPostRef.key, date.getTime());
        addUserSession(user2, newPostRef.key, date.getTime());
    });
    // Return unique key
    return newPostRef.key;
}

// Shuffle array values at position random
function shuffle(arr){
    for(let j, x, i = arr.length; i; j = Math.floor(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr;
}

// Get session by session id
async function getSession(session_id) {
    return await new Promise((resolve, reject) => {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `multiplayer/${session_id}`)).then((snapshot) => {
            // Check if session exists
            if (snapshot.exists()) {
                resolve(snapshot.val());
            } else {
                // If session does not exist - error 404
                reject({
                    status: 404,
                    error: "Session not found"
                });
            }
        }).catch((error) => {
            // Firebase error
            reject({
                status: 500,
                error: error
            })
        });
    })
}

// Function to insert to each user which game they participate
async function addUserSession(user_id, session_id, date) {
    return await new Promise(resolve => {
        const postListRef = ref(db, `users/${user_id}/games/${date}`);
        set(postListRef, { session_id: session_id}).then(r => {
            resolve(r);
        })
    })

}

// Get player data by user id
async function getPlayer(user_id) {
    return await new Promise(((resolve, reject) => {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `users/${user_id}`)).then((snapshot) => {
            // return user data
             resolve(snapshot.val());
        }).catch(err => {
            // Firebase error
            reject({
                status: 500,
                error: err
            })
        });
    }))
}

// Get full date format dd-MM-YYYY hh:mm:ss
function getFullDay() {
    let date = new Date();
    return date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

// Update player status to join
function playerJoin(user_id, session_id) {
    getSession(session_id).then(game => {
        game[user_id].status = 'join';
        const updates = {};
        updates['multiplayer/' + session_id] = game;
        update(ref(db), updates);
    })
}
// Get opponent user id from session id
function getOpponentUserID(user_id, session_id) {
    return new Promise(resolve => {
        getSession(session_id).then(data => {
            if(data !== false) {
                if (data.users.player1 === user_id) {
                    resolve(data.users.player2)
                } else {
                    resolve(data.users.player1)
                }
            }
        })
    })
}

async function getOpponentName(session_id, user_id) {
    return await new Promise(resolve => {
        getSession(session_id)
            .then(data => {
                resolve(data[user_id].name);
            })
    })
}

// async function userRageQuit(session_id, user_id) {
//     return await new Promise(resolve => {
//         getSession(session_id, (val)=> {
//             let data = val;
//             if (data !== false && data.status !== 'done') {
//
//                 if (data.users.uid1 === user_id) {
//                     data.scores.uid1 = 0;
//                 } else {
//                     data.scores.uid2 = 0;
//                 }
//
//                 const updates = {};
//                 updates['multiplayer/' + session_id] = data;
//                 update(ref(db), updates).then(r => console.log(r)).catch(err => console.log(err));
//                 resolve();
//             }
//         });
//     })
// }

// Close session - game_over - insert score data to the session
function closeSession(session_id, data) {
    const updates = {};
    updates['multiplayer/' + session_id] = data;
    update(ref(db), updates);
}

// Get score from session id
async function getScore(session_id) {
    return await new Promise(resolve => {
        getSession(session_id).then(data => {
            let player1 = data[data.users.player1];
            let player2 = data[data.users.player2];

            // Return scores with suitable format
            resolve(player1.name + " " + player1.score + " - " + player2.name + " " + player2.score)
        })
    })
}

module.exports = {router, createSession, playerJoin, getOpponentUserID, getPlayer, getScore, closeSession, getSession, getOpponentName};