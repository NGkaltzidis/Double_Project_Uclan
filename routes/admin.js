/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

const express = require('express');
const Auth = require('./Auth');
const Questions = require("./questions");
const router = express.Router();

// Render admin dashboard
router.get('/', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req, user => {
        // Check if user is admin
        if(user.extra.admin === true) {
            // Status 200 - sent admin info - name, email
            res.status(200).render('admin/dashboard', {
                name: user.name,
                email: user.email,
            })
        }else {
            // Else if user is not admin - redirect to homepage
            res.redirect('/404')
        }
    }, () => {
        // If user is not logged in redirect to homepage
        res.redirect('/');
    })
})

// Get tasks Json
router.get('/tasks', (req, res) => {
    Questions.getAllQuestions().then((data) => {
        // status 200 - sent task data with json
        res.status(200).json(data);
    }).catch(err =>{
        // Firebase error
        res.status(err.status).json(err.error);
    });
})

// Render new question
router.get('/new', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req, user => {
        // Check if user is admin
        if(user.extra.admin === true) {
            // Status 200 - render new question page
            res.status(200).render('admin/newQuestion', {
                name: user.name,
                email: user.email,
            })
        }else {
            // If user is not admin redirect to play
            res.redirect('/404')
        }
    }, () => {
        // If user is not logged in redirect to homepage
        res.redirect('/');
    })
})

// Render edit question
router.get('/edit', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req, user => {
        // Check if user is admin
        if(user.extra.admin === true) {
            let question_id = req.query.id;
            // Get question with key
            Questions.getQuestion(question_id).then(data => {
                data.key = question_id;
                // Status 200 - render edit question page
                res.status(200).render('admin/editQuestion', {
                    name: user.name,
                    email: user.email,
                    data: data,
                })
            }).catch(err => {
                // Question error
                res.redirect('/404');
            })
        }else {
            // If user is not admin redirect to play
            res.redirect('/404');
        }
    }, () => {
        // If user is not logged in - redirect to homepage
        res.redirect('/');
    })
})

// Render test question
router.get('/test', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,(user) => {
        // Check if Question exists in cookies
            if (req.query.test !== undefined && get_cookies(req)[req.query.test] !== undefined) {
                // Decode cookie url
                let question = JSON.parse(decodeURIComponent(get_cookies(req)[req.query.test]));
                question.type = 'test'
                res.clearCookie(req.query.test);
                // Status 200 - render playground
                res.status(200).render('playground', {
                    name: user.name,
                    uid: user.uid,
                    questions: question,
                    user_loggedIn: true,
                    admin: true
                });
            }
            else{
                // If question does not exist close window
                res.send("<script>window.close();</script > ");
            }
        }
        , () => {
            // If user is not logged in redirect to homepage
            res.redirect('/');
        })
})


// Get cookies from requested URL
function get_cookies(request) {
    let cookies = {};
    request.headers && request.headers.cookie.split(';').forEach(function(cookie) {
        let parts = cookie.match(/(.*?)=(.*)$/)
        cookies[ parts[1].trim() ] = (parts[2] || '').trim();
    });
    return cookies;
}

module.exports = router;