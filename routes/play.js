const express = require('express');
const router = express.Router();
const Auth = require("./Auth");
const Questions = require('./questions');
const {ref, getDatabase, get, child, limitToLast, query} = require("firebase/database");

// Render play page for the user specified
router.get('/' , (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        // status 200 - Sent name, user logged, id, admin
        res.status(200).render('play', {
            name: user.name,
            user_loggedIn: true,
            uid: user.uid,
            admin: user.extra.admin,
        })
    }, () => {
        // If user not logged in - Redirect to homepage
        res.redirect('/');
    })

})

// Get all tasks from API
router.get('/tasks', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        // Get all Questions
        Questions.getAllQuestions().then((data) => {
            // Get user tasks
            getUserTasks(req, data, user)
                .then(object => {
                    // Status 200 - Sent information about questions (last finished, length, question)
                    res.status(200).json(object);
                })
            })
            .catch(err => {
                // Check if firebase error
                res.status(err.status).json(err.error);
            });

    }, () => {
        // If user not logged in - Status 403 authentication
        res.status(403).json({
            error: "Authentication required"
        })
    })
});

// Get the last question that user finished
async function getUserTasks(req, questions, user) {
    return await new Promise(async resolve => {
        let object = {
            questions: questions,
            info: {
                lastDone: 0,
            }
        }
        // Get the length of the questions ->Done
        Questions.getQuestionsLength().then(length => {
            object.info.length = length;
        })
        // Get Firebase database reference
        const dbRef = ref(getDatabase());

        // Get last done question
        await get(query(child(dbRef, `users/${user.uid}/tasks/`), limitToLast(1))).then((snapshot) => {
            // Check if user has finished the task with question id
            if(snapshot.exists()){
                // increment the last done question
                object.info.lastDone = Number(Object.keys(snapshot.val())[0]) + 1;
            }
        })

        // Loop through each question
        for(let i = 0; i < questions.length; i++) {
            // If question is less than last done - set done state true
            if (i < object.info.lastDone) {
                // Set question done state true
                questions[i].isDone = true;
            }
            else {
                // Set question done state false
                questions[i].isDone = false;
            }
        }

        // Sent data with promise
        resolve(object);
    })
}

module.exports = router;