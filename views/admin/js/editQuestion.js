/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

let items = data.validation.testCases.length;
let moreBtn = document.getElementById('moreBtn');
let tasks =  document.getElementById('tasks');
var editor = CodeMirror.fromTextArea(document.getElementById("usr_code"), {
    lineNumbers: true,
    mode: "javascript",
    styleActiveLine: true,
    matchBrackets: true,
    indentUnit: 4,
    autoCloseBrackets: true,
    theme: 'darcula'
});

Simditor.locale = 'en-US';
toolbar = ['title', 'bold', 'italic', 'underline', 'fontScale', 'color', '|', 'ol', 'ul', 'blockquote', 'code', '|', 'link', 'hr', '|', 'indent', 'outdent', 'alignment'];
var textEditor = new Simditor({
    textarea: $('#textEditor'),
    toolbar: toolbar
});

// Load more testcases in admin dashboard
function loadMoreTests() {
    // Check if testcases are more than 1
    if(items > 1) {
        // Hide the last remove button of testcases
        let item = document.getElementById(`test${items}`);
        item.getElementsByClassName('close')[0].style.display = 'none';
    }
    // Increment testcases
    items++;
    let div = document.createElement("div");
    div.id = `test${items}`;
    div.innerHTML =`
            <div id="test${items}">
                <div class="form_head_text">
                    <h3>TestCase ${items}</h3>
                    <span class="close" onclick="removeTest('test${items}')"><i class="fas fa-trash"></i></span>
                </div>
                <div class="form_objects">
                    <label for="email">Argc</label>
                    <input type="text" name="args${items}" placeholder="Ex 10 3" autocomplete="off">
                </div>

                <div class="form_objects">
                    <label for="email">Argv</label>
                    <input type="text" name="argv${items}" placeholder="Ex string coding" autocomplete="off">
                </div>

                <div class="form_objects">
                    <label for="email">Expected output</label>
                    <input type="text" name="complete${items}" placeholder="Ex max number 5" autocomplete="off" required>
                </div>
            </div>`;

    // Append testcase element
    tasks.appendChild(div);
}

// Delete testcase
function removeTest(test) {
    // Get testcase
    let testDiv = document.getElementById(test);
    // Remove testcase
    testDiv.remove();
    // Decrease testcases
    items--;
    // Check if testcases are more than 1
    if(items > 1) {
        let item = document.getElementById(`test${items}`);
        // Make last questions remove icon visible
        item.getElementsByClassName('close')[0].style.display = 'block';
    }
}

// Submit edited question
document.getElementById('newQuestion').onsubmit = function (event) {
    event.preventDefault();

    let formData = new FormData(this);
    let obj = {
        question: {
            question: formData.get("task"),
            documentation: textEditor.getValue(),
            difficulty: formData.get('difficulty'),
            code: editor.getValue('\n').replaceAll('"', "'"),
            correct: formData.get('complete'),
            key: data.key,
            validation: {
                testCases: []
            }
        }
    };

    // Check if argc is not empty
    if (formData.get('args') !== "") {
        obj.question.argc = formData.get('args').split(' ')
    }

    // Check if argv is not empty
    if (formData.get('argv') !== "") {
        obj.question.argv = formData.get('argv').split(' ');

        // Replace underscore with white space
        for (let i = 0; i < obj.question.argv.length; i++) {
            obj.question.argv[i] = obj.question.argv[i].replaceAll('_', ' ');
        }
    }

    // Loop through testcases to get the data
    for (let i = 1; i <= items; i++) {
        let tempObj = {
            argc: formData.get('args' + i).split(' '),
            argv: formData.get('argv' + i).split(' '),
            correct: formData.get('complete' + i),
        }

        // Replace underscore with white space
        for (let i = 0; i < tempObj.argv.length; i++) {
            tempObj.argv[i] = tempObj.argv[i].replaceAll('_', ' ');
        }


        // Push data to validation testcases
        obj.question.validation.testCases.push(tempObj);
    }

    // Check if question is of type test
    if (document.querySelector("[test=true]") !== null) {
        // Set question data to cookie
        setCookie(obj.question.question, encodeURIComponent(JSON.stringify(obj.question)), 1);
        // Open question on test page
        window.open('test?test=' + obj.question.question, '_block');
        // Remove test attribute
        document.querySelector("[test=true]").removeAttribute('test');
    } else {
        // Submit question to firebase
        fetch('/questions/edit', {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=UTF-8',
                "CSRF-Token": Cookies.get("XSRF-TOKEN"),
            }
        }).then(d => {
            // Check if status is 200
            if (d.status === 200) {
                // Redirect to admin page
                window.location.assign('/admin')
            } else {
                // If error - output error
                let error = document.getElementById('error_txt');
                error.innerText = "Something Went Wrong";
                error.scrollIntoView();
            }
        }).catch(err => {
            // If error - output error
            let error = document.getElementById('error_txt');
            error.innerText = err.message;
            error.scrollIntoView();
        })
    }
}