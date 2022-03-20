/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

let runTimesUser = 'a';
const windowAlert = window.alert;
let data;

// Set questions data
function setQuestion(question, ready) {
    data = question;
    ready(data);
}

// Overwrite console.log
console.log = function (log) {
    if(typeof log === "object") {
        log = JSON.stringify(log);
    }
    document.getElementById('output').innerHTML += log + "<br>";
}

// Overwrite alert
alert = function (text) {
    document.getElementById('output').innerHTML += text;

    return windowAlert(text);
}

// Overwrite Document.write
document.write = function (text) {
    document.getElementById('output').innerHTML += text;
}

// Overwrite onerror function
window.onerror = function (err, url, line) {
    document.getElementById('errors').innerHTML += "Error: " + err + "\nAt line " + line;
}

// Overwrite console.error
console.error = function (err) {
    document.getElementById('errors').innerHTML += "Error: " + err;
}

/*
function getNumber() {
    return data.input;
}*/

// Run users code
function run() {
    // Check if users code is not null
    if (localStorage.getItem('code') !== null) {
        document.getElementById('testCode').innerHTML = localStorage.getItem('code');
        localStorage.removeItem('code');
        localStorage.removeItem('draft')
    }
}

// Run code with arguments passed
function runCode(argc, argv) {
    try {
        main(argc, argv);
    }catch (err) {
        console.error(err.message);
    }
}

// Submit question
async function submit(questions) {
    return await new Promise(resolve => {
        let done = false;
        let argc = '';
        let argv = '<br>';
        try {
            console.time('exec')
            main(questions.argc, questions.argv);
            console.timeEnd('exec')
        } catch (err) {
            console.error(err.message);
        }
        let output = document.getElementById('output');
        output.style.display = 'none';
        let test = output.innerHTML.replaceAll('<br>', ' ');
        let errors = document.getElementById('errors');
        console.table(test);
        console.table(questions.correct)
        // Check if users code matches the expected output and there are no errors
        if (test.trim() == questions.correct.trim() && errors.innerText === "") {
            output.innerText = "";
            let testCases = questions.validation.testCases;
            // Go through all testcases
            for (let i = 0; i < testCases.length; i++) {
                output.innerText = "";
                try {
                    // Pass argc && argv
                    main(testCases[i].argc, testCases[i].argv);
                } catch (err) {
                    console.error(err.message);
                }
                output = document.getElementById('output');
                test = output.innerHTML.replaceAll('<br>', ' ');
                console.table(output.innerText);
                errors = document.getElementById('errors');
                // Check if code matches the testcases output && there are no errors
                if (test.trim() == testCases[i].correct.trim() && errors.innerText === "") {
                    document.getElementById('correct').style.display = 'block'
                    done = true;
                } else {
                    document.getElementById('correct').style.display = 'none'
                    document.getElementById('wrong').style.display = 'block'
                    // Check if argc exists in testcases
                    if (testCases[i].argc) {
                        argc = "<br>Number: " + testCases[i].argc + "<br>";
                    }
                    // Check if argv exists in testcases
                    if (testCases[i].argv) {
                        argv = "argv: " + testCases[i].argv + "<br>";
                    }
                    document.getElementById('wrong').innerHTML += " " + argc + argv + "Output: " + test + "<br>Expected: " + testCases[i].correct;
                    done = false;
                    break;
                }
            }
        } else {
            document.getElementById('wrong').style.display = 'block'
            // Check if argc exists in questions
            if (questions.argc) {
                argc = "<br>Number: " + questions.argc + "<br>";
            }
            // Check if argv exists in questions
            if (questions.argv) {
                argv = "argv: " + questions.argv + "<br>";
            }
            document.getElementById('wrong').innerHTML += " " + argc + argv + "Output: " + test + "<br>Expected: " + questions.correct;
            done = false
        }

        resolve(done);
    });
}




