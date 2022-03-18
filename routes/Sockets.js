const multiplayer = require("./multiplayer");
const fs = require('fs')

// Create Sockets class
class Sockets {
    data; // JSON

    constructor() {
        // Create schema
        this.data = {
            onlineUsers: {},
            multiplayer: {}
        }
    }
    // Push online users into JSON
    PushOnlineUser(user_id, socket_id) {
        this.data.onlineUsers[socket_id] = user_id;
        // Update log file
        fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
    }

    // Push multiplayer session into JSON
    async PushMultiplayerSession(session_id, player1, player2) {
        let date = new Date();
        this.data.multiplayer[session_id] = {
            createdAt: date.getTime(),
            status: 'active',
            users: {
                player1: player1,
                player2: player2
            }
        };
        // Get Player1
        await multiplayer.getPlayer(player1).then(data => {
            this.data.multiplayer[session_id][player1] = {
                score: 0,
                name: data.name,
                status: 'pending'
            }
        });
        // Get Player2
        await multiplayer.getPlayer(player2).then(data => {
            this.data.multiplayer[session_id][player2] = {
                score: 0,
                name: data.name,
                status: 'pending'
            }
        });

        // Update log file
        fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
    }
    // Update user score
    UpdateUserScore(session_id, player_id, score, increase) {
        // Check if session exists
        if(this.data.multiplayer[session_id]) {
            // Check if score is increased
            if (increase) {
                // Score +1
                this.data.multiplayer[session_id][player_id].score += 1;
            } else {
                // If score is not affected assign current score
                this.data.multiplayer[session_id][player_id].score = score;
            }
        }
        // Update log file
        fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
    }

    UpdateSessionStatus(session_id, status) {
        if(this.data.multiplayer[session_id]) {
            this.data.multiplayer[session_id].status = status;
            // Update log file
            fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
        }
    }

    // Update user status
    UpdateUserMultiplayerStatus(session_id, user_id, status) {
        this.data.multiplayer[session_id][user_id].status = status;
        // Update log file
        fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
    }


    // Remove user from JSON
    RemoveUser(socket_id) {
        delete this.data.onlineUsers[socket_id];
        // Update log file
        fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
    }
    // Terminate Session
    DestroySession(session_id) {
        delete this.data.multiplayer[session_id];
        // Update log file
        fs.promises.writeFile('./sockets/log.json', JSON.stringify(this.data, null, 4), 'utf8');
    }
    // Get user id from socket id
    GetUserIDBySocketID(socket_id) {
        // Check if user exists in JSON with socket id key
        if(this.data.onlineUsers[socket_id]) {
            return this.data.onlineUsers[socket_id];
        }

        return false;
    }
    // Get socket id from user id
    GetSocketIDByUserID(user_id) {
        let socket_id = [];
        // Loop and check if user id matches value and return key (socket id)
        Object.entries(this.data.onlineUsers).forEach(([key, val]) => {
            if (val === user_id) {
                socket_id.push(key);
            }
        })

        return socket_id;
    }
    // Get session id from user id
    GetSessionIDByUserID(user_id) {
        let session_id = false;
        // Loop and check both players if user id matches a player and return key (session id)
        Object.entries(this.data.multiplayer).forEach(([key, val]) => {
            if (val.users.player1 === user_id || val.users.player2 === user_id) {
                session_id = key;
            }
        })

        return session_id;
    }
    // Get number of active players
    GetNumberOfOnlinePlayers() {
        return this.FilterOnlineUsers().length;
    }
    // Return name, lastname, email, and user id for each active player
    async GetOnlinePlayers() {
        return await new Promise(async resolve => {
            let response = [];
            let users = this.FilterOnlineUsers();
            for (let i = 0; i < users.length; i++) {
                await multiplayer.getPlayer(users[i].user_id).then(r => {
                    response.push({
                        name: r.name,
                        lastname: r.lastname,
                        email: r.email,
                        uid: users[i].user_id
                    })
                });
            }

            resolve(response);
        })
    }

    // Remove duplicate sockets with same user id
    FilterOnlineUsers() {
        let array = [];
        for (const [key, val] of Object.entries(this.data.onlineUsers)) {
            array.push({
                user_id: val,
                socket_id: key
            })
        }
        // Return unique sockets
        return array.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                    t.user_id === thing.user_id
                ))
        )
    }

    // Get date format
    GetFullDay() {
        let date = new Date();
        return date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    }

    // Get session data
    async GetSessionData(session_id) {
        return await new Promise(resolve => {
            if (this.data.multiplayer[session_id]) {
                return resolve(this.data.multiplayer[session_id]);
            }

            multiplayer.getSession(session_id).then(r => {
                return resolve(r)
            })
        })

    }

    // Get scores for both users
    async GetSessionScores(session_id) {
        return await new Promise(resolve => {
            if (this.data.multiplayer[session_id]) {
                let player1 = this.data.multiplayer[session_id][this.data.multiplayer[session_id].users.player1];
                let player2 = this.data.multiplayer[session_id][this.data.multiplayer[session_id].users.player2];

                // Return scores with suitable format
                return resolve(player1.name + " " + player1.score + " - " + player2.name + " " + player2.score);
            }

            multiplayer.getScore(session_id).then(r => {
                resolve(r);
            });

        })
    }

    async GetOpponentName(session_id, user_id) {
        return await new Promise(resolve => {
            if(this.data.multiplayer[session_id]) {
                return resolve(this.data.multiplayer[session_id][user_id].name);
            }

            multiplayer.getOpponentName(session_id, user_id)
                .then(res => {
                    resolve(res);
                })
        })
    }

    // Get opponent user id
    async GetOpponentUserID(session_id, user_id) {
        return await new Promise(resolve => {
            // Check if session exists
            if (this.data.multiplayer[session_id]) {
                // Check if Player 1 exists and return Player 2
                if (this.data.multiplayer[session_id].users.player1 === user_id) {
                    return resolve(this.data.multiplayer[session_id].users.player2)
                }

                return resolve(this.data.multiplayer[session_id].users.player1)
            }

            multiplayer.getOpponentUserID(user_id, session_id).then(opponent => {
                return resolve(opponent);
            })
        })
    }

}

module.exports = Sockets;