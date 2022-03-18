let moreBtn = document.getElementById('moreBtn');
let tasks =  document.getElementById('tasks');
let items = 1;
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

editor.setValue('function main(argc, argv) {\n\t// Insert Code Bellow\n}')

function loadMoreTests() {
    if(items > 1) {
        let item = document.getElementById(`test${items}`);
        item.getElementsByClassName('close')[0].style.display = 'none';
    }

    items++;
    let div = document.createElement("div");
    div.id = `test${items}`;
    div.innerHTML =`
            <div id="test${items}">
                <div class="form_head_text">
                    <h3>TestCase ${items}</h3>
                    <span class="close" onclick="removeTest('test${items}')"><i class="fas fa-times"></i></span>
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

    tasks.appendChild(div);
}

// Remove hidden test
function removeTest(test) {
    let testDiv = document.getElementById(test);
    testDiv.remove();
    items--;
    if(items > 1) {
        let item = document.getElementById(`test${items}`);
        item.getElementsByClassName('close')[0].style.display = 'block';
    }
}

// Add new question
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
            validation: {
                testCases: []
            }
        }
    };

    // Check if argc is not empty
    if(formData.get('args') !== "") {
        obj.question.argc = formData.get('args').split(' ')
    }
    // Check if argv is not empty
    if(formData.get('argv') !== "") {
        obj.question.argv = formData.get('argv').split(' ');

        for(let i = 0; i < obj.question.argv.length; i++) {
            obj.question.argv[i] = obj.question.argv[i].replaceAll('_', ' ');
        }
    }



    for(let i = 1; i <= items; i++) {
        let tempObj = {
            argc: formData.get('args' + i).split(' '),
            argv: formData.get('argv' + i).split(' '),
            correct: formData.get('complete' + i),
        }

        for(let i = 0; i < tempObj.argv.length; i++) {
            tempObj.argv[i] = tempObj.argv[i].replaceAll('_', ' ');
        }

        obj.question.validation.testCases.push(tempObj);
    }


    if(document.querySelector("[test=true]") !== null) {
        console.log(JSON.stringify(obj))
        setCookie(obj.question.question, encodeURIComponent(JSON.stringify(obj.question)), 1);
        window.open('test?test=' + obj.question.question, '_block');
        document.querySelector("[test=true]").removeAttribute('test');
    }else {
        fetch('/questions/new', {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=UTF-8',
                "CSRF-Token": Cookies.get("XSRF-TOKEN"),
            }
        }).then(d => {
            if(d.status === 200) {
                window.location.assign('/admin')
            }else{
                let error = document.getElementById('error_txt');
                error.innerText = "Something Went Wrong";
                error.scrollIntoView();
            }
        }).catch(err => {
            let error = document.getElementById('error_txt');
            error.innerText = err.message;
            error.scrollIntoView();
        })
    }
}