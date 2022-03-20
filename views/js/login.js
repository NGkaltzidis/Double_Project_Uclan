/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

// Get login form && submit event
document.getElementById("login")
    .addEventListener("submit", (event) => {
        // Prevent redirecting to new page
        event.preventDefault();
        const login = event.target.email.value;
        const password = event.target.password.value;
        const text = document.getElementById('msg_txt');
        text.classList.remove('error-text')
        text.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Collecting Data";

        // Firebase authentication
        firebase.auth()
            .signInWithEmailAndPassword(login, password)
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
                text.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Checking Data"
                return firebase.auth().signOut();
            })
            .then(() => {
                text.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i> Success, Logging in"
                window.location.assign("/");
            }).catch(err => {
                text.innerHTML = "Wrong Email or Password."
                text.classList.add('error-text');
        });
    });