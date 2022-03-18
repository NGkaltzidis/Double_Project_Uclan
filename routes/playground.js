const express = require('express');
const Auth = require("./Auth");
const questions = require('./questions');
const {set, ref, getDatabase, get, child} = require("firebase/database");
const firebase = require("./database");
const db = getDatabase(firebase);
const router = express.Router();

// Get method and return the question assigned into the ID
router.get('/:ID', ((req, res) => {
    const ID = req.params.ID; // get ID from params
    // Check if user is logged in and proceed
    Auth.checkIfUserIsLoggedIn(req,(user) => {
            // Check if ID is not undefined
            if (req.params.ID !== undefined) {
                // Get question from given ID
                questions.getQuestion(ID).then(r => {
                    // Get users tasks
                    if(user.extra.tasks) {
                        // Check if user has access in this question
                        if(user.extra.tasks.length + 1 > Number(ID) - 1) {
                            // Render page
                            res.render('playground', {
                                name: user.name,
                                uid: user.uid,
                                questions: r,
                                id: ID,
                                user_loggedIn: true,
                                admin: user.extra.admin
                            });
                        }else{
                            // Redirect into play page if user has no access
                            res.redirect('/play')
                        }
                    }else{
                        // If user has never played, enable access only to first question
                        if(Number(ID) === 0) {
                            res.render('playground', {
                                name: user.name,
                                uid: user.uid,
                                questions: r,
                                user_loggedIn: true,
                                id: user.uid,
                                admin: user.extra.admin
                            });
                        }else{
                            // Redirect into play page
                            res.redirect('/play');
                        }
                    }

                }).catch(err => {
                    // Question error
                    res.redirect('/404');
                })
            }else{
                // If ID is undefined -> Redirect to 404 page
                res.redirect('/404');
            }
        }
        , () => {
            // If User is not logged in, redirect to homepage
            res.redirect('/');
        })
}))
// Render the run code page
router.get('/run/code', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
            res.status(200).render('runCode');
        }
        , () => {
            // If user is not logged in -> Redirect to home page
            res.redirect('/');
        })
})
// Set question to done
router.post('/done/:ID', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        const ID = req.params.ID; // Get ID from params
        // Set tasks for the given user ID
        set(ref(db, 'users/' + user.uid + '/tasks/' + ID), {
            time: req.body.time
        }).then(r => {
            // Check if there are any available questions
            questions.getNextQuestion(parseInt(ID) + 1).then(nextKey => {
                // Status 200 - Sent next question
                res.status(200).json({
                    next: nextKey,
                })
            }).catch(err => {
                // Next Question error
                res.status(err.status).json(err.error);
            })
        }).catch(err => {
            // If firebase error - status code 500
            res.status(500).json({
                error : err
            })
        });
    }, () => {
        // If User not logged in - status 403 authentication
        res.status(403).json({
            status: 403,
            message: "Require Authentication"
        })
    });
});



module.exports = router;