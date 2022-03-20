/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

const express = require('express');
const moment = require('moment-timezone');
const momentDurationFormatSetup = require("moment-duration-format");
const Auth = require("./Auth");
const {ref, getDatabase, get, child} = require("firebase/database");
const firebase = require("./database");
const questions = require("./questions");
const db = getDatabase(firebase);
const router = express.Router();

// Render scoreboard page
router.get('/', (req, res) => {
    Auth.checkIfUserIsLoggedIn(req, user => {
        res.status(200).render('scoreboard', {
            name: user.name,
            uid: user.uid,
            user_loggedIn: true,
            admin: user.extra.admin
        })
    }, () => {
        res.redirect('login');
    })
})

// Get scoreboard data
router.get('/topten', (req, res) => {
    // Database connection
    const dbRef = ref(getDatabase());

    // Get all users
    get(child(dbRef, `users`)).then(async (snapshot) => {
        let usersScoreboard = [];
        let users = snapshot.val();
        let totalQuestions = await questions.getQuestionsLength();

        // Loop through all users
        Object.keys(users).forEach(data => {
            // Check if user finished any task
            if (users[data].tasks) {
                let totalTime = 0;

                // Calculate time for all done questions
                users[data].tasks.forEach(games => {
                    totalTime += games.time;
                })

                let dur = moment.duration.format([moment.duration(totalTime, 'seconds')],'hh:mm:ss', {
                    trim: false
                });

                // Push user data
                usersScoreboard.push({
                    uid: data,
                    time: dur[0],
                    name: users[data].name,
                    lastname: users[data].lastname,
                    score: users[data].tasks.length,
                    questions: totalQuestions
                })
            } else {
                // Push user data
                usersScoreboard.push({
                    uid: data,
                    time: "00:00:00",
                    name: users[data].name,
                    lastname: users[data].lastname,
                    score: 0,
                    questions: totalQuestions
                })
            }
        })

        // Sort array
        usersScoreboard.sort((a, b) => {
            if (a.score === b.score) {
                return a.time > b.time ? -1 : 1
            } else {
                return a.score < b.score ? -1 : 1
            }
        })

        // Return reversed scoreboard data
        res.status(200).json(usersScoreboard.reverse());
    }).catch((error) => {
        // Database Error
        res.status(500).json(error)
    });
})


module.exports = router;