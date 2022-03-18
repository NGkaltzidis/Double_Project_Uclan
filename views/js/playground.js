let run = document.getElementById('runCode');
let submit = document.getElementById('submitBtn');
let output = document.getElementById('outputCode');
let editor = CodeMirror.fromTextArea(document.getElementById("usr_code"), {
    lineNumbers: true,
    mode: "javascript",
    styleActiveLine: true,
    matchBrackets: true,
    indentUnit: 4,
    autoCloseBrackets: true,
    theme: "darcula",
});


editor.setValue(questions.code);

// Run button event
run.onclick = function () {

    // Set user code to local storage
    localStorage.setItem('code', editor.getValue('\n'));

    output.src = "/playground/run/code";
    output.onload = function () {
        output.contentWindow.setQuestion(questions, (q) => {
            output.contentWindow.run();
            output.contentWindow.main(questions.argc, questions.argv);
        });
    }

}

// Calculate time
let timerVar = setInterval(countTimer, 1000);
let totalSeconds = 0;
function countTimer() {
    ++totalSeconds;
}

// Submit onclick button
submit.onclick = function () {

    // Set user code to local storage
    localStorage.setItem('code', editor.getValue('\n'));

    output.src = "/playground/run/code";
    output.onload = function () {
        output.contentWindow.setQuestion(questions, (q) => {
            output.contentWindow.run();
            output.contentWindow.submit(questions).then(data => {
                let json = {
                    time: totalSeconds
                }
                // Check if question is not of type test
                if (data && questions.type !== 'test') {
                    // Sent request that question is done
                    fetch('/playground/done/' + task, {
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
                                // Check if status is not 200 - Error
                                if (response.status !== 200) {
                                    errorNotifications(response.error)
                                    return;
                                }

                                // Examine the text in the response
                                response.json().then(function (data) {
                                    let next = document.getElementById('submitBtn');
                                    next.innerHTML = "Next <i class=\"far fa-arrow-alt-circle-right\"></i>";
                                    next.className = "next_btn";
                                    next.onclick = function () {
                                        location.assign(data.next);
                                    }
                                });
                            }
                        )
                        .catch(function (err) {
                            errorNotifications(err);
                        });
                }
            });
        });
    }
}
