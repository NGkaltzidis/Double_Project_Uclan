let run = document.getElementById('runCode');
let submit = document.getElementById('submitBtn');
let output = document.getElementById('outputCode');
let editor = CodeMirror.fromTextArea(document.getElementById("usr_code"), {
    lineNumbers: false,
    mode: "javascript",
    styleActiveLine: true,
    matchBrackets: true,
    indentUnit: 4,
    autoCloseBrackets: true,
    theme: "darcula",
});

editor.setValue(questions.code);

// Run button onclick
run.onclick = function () {

    // Set user code to local storage
    localStorage.setItem('code', editor.getValue('\n'));

    output.src = "/playground/run/code";
    output.onload = function () {
        output.contentWindow.setQuestion(questions, (q) => {
            output.contentWindow.run();
            output.contentWindow.runCode(questions.argc, questions.argv);
        });
    }

}

// Timer for finishing the question
let timerVar = setInterval(countTimer, 1000);
let totalSeconds = 0;
function countTimer() {
    ++totalSeconds;
}

// Submit onclick button
submit.onclick = function () {
    // Set users code to local storage
    localStorage.setItem('code', editor.getValue('\n'));

    output.src = "/playground/run/code";
    output.onload = function () {
        output.contentWindow.setQuestion(questions, (q) => {
            output.contentWindow.run();
            output.contentWindow.submit(questions).then(data => {
                let json = {
                    key: key,
                    time: totalSeconds,
                    session_id: localStorage.getItem('session_id')
                }



                // If question is not in test mode by admin
                if (data && questions.type !== 'test') {
                    // Insert json body
                    fetch('/multiplayer/done', {
                        method: 'POST',
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "CSRF-Token": Cookies.get("XSRF-TOKEN"),
                        },
                        body: JSON.stringify(json),
                    })
                        .then(
                            function (response) {
                                if (response.status !== 200) {
                                    errorNotifications(response.error)
                                    return;
                                }

                                // Examine the text in the response
                                response.json().then(function (data) {
                                    window.location.replace(data.next)
                                    window.dispatchEvent(new Event('updateScore'))
                                });
                            }
                        )
                        .catch(function (err) {
                            errorNotifications(err.error)
                        });
                }
            });
        });
    }
}
