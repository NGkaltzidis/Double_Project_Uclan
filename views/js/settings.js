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
        })


    return false;
}

// Update Password (Settings)
function updatePassword(form) {
    form = new FormData(form);
    // Prevent from loading new page
    window.event.preventDefault();
    // Firebase authentication
    firebase.auth()
        .signInWithEmailAndPassword(email, form.get("old-password"))
        .then(({user}) => {
            // Send password
            fetch('password' , {
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
                .catch(function(err) {
                    errorNotifications(err)
                });
        })
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