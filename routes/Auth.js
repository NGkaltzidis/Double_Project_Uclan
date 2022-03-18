const express = require('express');
const admin = require("firebase-admin");
const {ref, set, getDatabase, get, child} = require("firebase/database");
const router = express.Router();

// Render login page
router.get("/login", function (req, res) {
    // Check if user is logged in
    checkIfUserIsLoggedIn(req, user => {
        // Redirect to play
        res.redirect('/play');
    }, () => {
        // If user not logged in - redirect to login page
        res.render("login.ejs", {
            admin: false,
            user_loggedIn: false
        });
    })
});

// Render register page
router.get("/register", function (req, res) {
    // Check if user is logged in
    checkIfUserIsLoggedIn(req, user => {
        // Redirect to play
        res.redirect('/play');
    }, () => {
        // If user not logged in redirect to register page
        res.render("register.ejs", {
            user_loggedIn: false,
            admin: false
        });
    })
});

// Render settings page
router.get("/settings", function (req, res) {
    // Check if user is logged in
    checkIfUserIsLoggedIn(req, user => {
        // Render settings and sent users previous data
        res.render("settings.ejs", {
            name: user.name,
            email: user.email,
            lastname: user.extra.lastname,
            user_loggedIn: true,
            uid: user.uid,
            admin: user.extra.admin
        });
    }, () => {
        // If user is not logged in - redirect to homepage
        res.redirect('/');
    })
});

// Update user settings
router.post('/settings', (req, res) => {
    // Check if user is logged in
    checkIfUserIsLoggedIn(req, user => {
        let name = req.body.name;
        // Update user
        admin.auth().updateUser(user.uid, {
            displayName: name,
            name: name,
            id: user.uid,
        }).then(r => {
            // Status 200 - sent updated data
            res.status(200).json(r);
        }).catch(err => {
            // Firebase error
            res.status(500).json(err);
        })
    },() =>{
        // If user is not logged in - error 403 - authentication
        res.status(403).json({
            error: 'Authentication required'
        })
    })
})

// Render password settings
router.get('/settings/password', (req, res) => {
    // Check if user is logged in
    checkIfUserIsLoggedIn(req, user => {
        // Render users previous data
        res.render("pass_settings.ejs", {
            name: user.name,
            email: user.email,
            uid: user.uid,
            user_loggedIn: true,
            admin: user.extra.admin
        });
    }, () => {
        // If user is not logged in - redirect to login
        res.redirect('/login');
    })
})

// Update password settings
router.post('/settings/password', (req, res) => {
    // Check if user is logged in
    checkIfUserIsLoggedIn(req, user => {
        // Update users new password
        admin.auth().updateUser(user.uid, {
            password: req.body.password,
        }).then(r => {
            // Status 200 - update
            res.status(200).json(r);
        }).catch(err =>{
            res.status(500).json(err);
        })
    }, () => {
        // If user is not logged in - authentication required
        res.status(403).json({
            error: 'Authentication required'
        })
    })
})

// Create session for user logged in
router.post('/sessionLogin', (req, res) => {
    const idToken = req.body.idToken.toString();

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    admin
        .auth()
        .createSessionCookie(idToken, { expiresIn })
        .then(
            (sessionCookie) => {
                const options = { maxAge: expiresIn, httpOnly: true };
                res.cookie("session", sessionCookie, options);
                res.end(JSON.stringify({ status: "success" }));
            },
            (error) => {
                // Bad request
                res.status(401).send("UNAUTHORIZED REQUEST!");
            }
        ).catch(err => {
            // Firebase error
            res.status(500).send(err);
        });
})

// Logout user
router.get("/logout", (req, res) => {
    res.clearCookie("session");
    res.redirect("/login");
});

// Check if user is logged in
function checkIfUserIsLoggedIn(req, loggedIn, loggedOut) {
    const sessionCookie = req.cookies.session || "";
    admin
        .auth()
        .verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .then((userData) => {
            const dbRef = ref(getDatabase());
            // Get user data
            get(child(dbRef, `users/${userData.uid}`)).then((snapshot) => {
                userData.extra = snapshot.val()
                loggedIn(userData)
            });
        })
        .catch((error) => {
            // If user not logged in - logout
            loggedOut(error);
        });
}

// Update users status in firebase
function updateUserStatus(status, id) {
    if(id) {
        const db = getDatabase();
        set(ref(db, 'users/' + id + "/connected"), {
            status: status
        });
    }
}

module.exports = {router, checkIfUserIsLoggedIn, updateUserStatus};
