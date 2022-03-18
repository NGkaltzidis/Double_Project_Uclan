// When document loads
document.addEventListener('DOMContentLoaded', async () => {
    // Get all questions
    await fetch('tasks')
        .then(async response => {
            await response.json().then(data => {
                // Load questions in dom
                loadQuestions(data);
            })
        })

    // Load questions to admin dashboard
    function loadQuestions(data) {
        // Create Questions elements
        let moduleItems = document.getElementById('moduleItems')
        let ul = document.createElement('ul');
        for(let i = 0; i < data.length; i++) {
            let li = document.createElement('li');
            let name = document.createElement('div');
            let question = document.createElement("div");
            let icon = document.createElement("div");
            let icon_edit = document.createElement('i');
            let icon_delete = document.createElement('i');
            li.classList.add('questions');
            name.classList.add('q_title');
            question.classList.add('q_name');
            icon.classList.add('q_icon');
            name.innerText = (i + 1) + ") Practice";
            question.innerText = data[i].question;
            icon_edit.className = "fas fa-edit";
            icon_edit.setAttribute('onclick', "location.assign('edit?id="+data[i].key+"')")
            icon_delete.className = "fas fa-trash";
            icon_delete.setAttribute('onclick', "deleteQuestion("+data[i].key+")")
            icon.appendChild(icon_edit);
            icon.appendChild(icon_delete);
            li.appendChild(name);
            li.appendChild(question);
            li.appendChild(icon);
            ul.appendChild(li);
        }

        moduleItems.getElementsByTagName('ul')[0].remove();
        // Append questions
        moduleItems.appendChild(ul);
    }
})

// Delete question function with key (id)
function deleteQuestion(key) {
    // Confirmation for deleting question
    let confirmation = confirm('Are you sure');

    // If not canceled
    if(confirmation) {
        // Request api to delete question
        fetch('/questions/delete', {
            method: 'post',
            body: JSON.stringify({
                key: key
            }),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=UTF-8',
                "CSRF-Token": Cookies.get("XSRF-TOKEN"),
            }
        }).then(response => {
            response.json().then(data => {
                // Reload page
                location.reload();
            })
        })
    }
}