/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

let err = document.getElementById('error_txt');
// Update profile
function update(form) {
    form = new FormData(form);
    window.event.preventDefault();

    // Firebase authentication
    firebase.auth()
        .signInWithEmailAndPassword(form.get("email"), form.get("password"))
        .then(({user}) => {
            // Send name and last name
            fetch('settings' , {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "CSRF-Token": Cookies.get("XSRF-TOKEN"),
                },
                body: JSON.stringify({
                    name: form.get("name"),
                    lastname: form.get("lastname")
                }),
            })
                .then(
                    async function (response) {
                        // Check if status is not 200
                        if (response.status !== 200) {
                            errorNotifications(response.error)
                            return;
                        }

                        // Examine the text in the response
                        response.json().then(function (data) {
                            loginUser(form.get("email"), form.get("password"))
                        });
                    }
                )
                .catch(function(err) {
                    errorNotifications(err)
                });
        }).catch(error => {
            err.innerHTML = '';
            errorNotifications(error.message)
        })


    return false;
}

// Update Password (Settings)
function updatePassword(form) {
    form = new FormData(form);
    // Prevent from loading new page
    window.event.preventDefault();

    // Check if password is valid
    if(validatePassword(form.get('password'), form.get('repeat-password'), err)) {
        // Firebase authentication
        firebase.auth()
            .signInWithEmailAndPassword(email, form.get("old-password"))
            .then(({user}) => {
                // Send password
                fetch('password', {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "CSRF-Token": Cookies.get("XSRF-TOKEN"),
                    },
                    body: JSON.stringify({
                        password: form.get('password')
                    }),
                })
                    .then(
                        async function (response) {
                            // Check if status is not 200
                            if (response.status !== 200) {
                                errorNotifications(response.error)
                                return;
                            }

                            // Examine the text in the response
                            response.json().then(function (data) {
                                loginUser(email, form.get("password"))
                            });
                        }
                    )
                    .catch(function (err) {
                        errorNotifications(err.message)
                    });
            }).catch(error => {
                err.innerHTML = '';
                errorNotifications(error.message)
            })
    }
}

// Login user when settings updated
function loginUser(email, password) {
    firebase.auth()
        .signInWithEmailAndPassword(email, password)
        .then(({user}) => {
            return user.getIdToken().then((idToken) => {
                return fetch("/sessionLogin", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "CSRF-Token": Cookies.get("XSRF-TOKEN"),
                    },
                    body: JSON.stringify({idToken}),
                });
            });
        })
        .then(() => {
            return firebase.auth().signOut();
        })
        .then(() => {
            window.location.reload()
        }).catch(err => {
            errorNotifications(err)
        });
}

// Validate password in register fields
function validatePassword(pass, pass_r, err) {
    err.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Checking Passwords";
    if(pass.length < 8) {
        err.innerHTML = "Password must be 8 characters long"
        err.classList.add('error-text')
        return false;
    }else if(pass !== pass_r) {
        err.innerHTML = "Passwords are not the same";
        err.classList.add('error-text')
        return false;
    }

    return true;
}