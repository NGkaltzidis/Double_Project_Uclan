// Register Button event listener
document.getElementById("register")
    .addEventListener("submit", (event) => {
        event.preventDefault();
        const email = event.target.email.value;
        const firstName = event.target.name.value;
        const lastName = event.target.lastname.value;
        const password = event.target.password.value;
        const password_r = event.target.password_repeat.value;
        const text = document.getElementById('msg_txt');
        text.classList.remove('error-text')
        text.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Collecting Data";
        // Check if password is not same in both inputs
        if (!validatePassword(password, password_r, text)) return;

        // Firebase authentication for registration
        firebase.auth()
            .createUserWithEmailAndPassword(email, password)
            .then(({user}) => {
                return user.updateProfile({
                    displayName: firstName,
                    name: firstName
                }).then(() => {
                    return firebase.database().ref('users/' + user.uid).set({
                        name: firstName,
                        lastname: lastName,
                        email: email,
                    }).then(() => {
                        firebase.auth().signOut();
                        text.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Register Done";
                        login(email, password, text);
                    })
                });
            }).catch(err => {
            text.classList.add('error-text');
            text.innerHTML = err.message;
        });
    });

// Login new user
function login(email, password, text) {
    firebase
        .auth()
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
            text.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Success Logging in";
            return firebase.auth().signOut();
        })
        .then(() => {
            window.location.assign("/");
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