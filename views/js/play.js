/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

// Document content loaded
document.addEventListener('DOMContentLoaded', async () => {
    await fetch('play/tasks')
        .then(async response => {
            await response.json().then(data => {
                loadQuestions(data.questions, data.info);
            })
        })

    let tasks = document.getElementsByClassName('questions');


    let unlockedTask = document.getElementsByClassName('unlock')[0];
    // Check if user has unlocked task
    if(unlockedTask) {
        unlockedTask.parentElement.scrollIntoView({
            behavior: 'smooth',
            block: "nearest",
            inline: "nearest"
        });
    }


    // Go through each task
    for(let i = 0; i < tasks.length; i++) {
        // Task onclick event
        tasks[i].onclick = function () {
            let isDone = tasks[i].querySelector('.done');
            let isUnlocked = tasks[i].classList.contains('unlock');
            // Check if questions status is Done / Unlocked
            if(isDone || isUnlocked) {
                window.location.assign('playground/' + tasks[i].getAttribute('question_key'))
            }
        }
    }
})

// Load questions function
function loadQuestions(data, info) {
    let moduleItems = document.getElementById('moduleItems')
    let ul = document.createElement('ul');
    // Go through each question
    for(let i = 0; i < data.length; i++) {
        // Insert html
        let li = document.createElement('li');
        let name = document.createElement('div');
        let question = document.createElement("div");
        let icon = document.createElement("div");
        let icon_child = document.createElement('i');
        li.classList.add('questions');
        name.classList.add('q_title');
        question.classList.add('q_name');
        icon.classList.add('q_icon');
        name.innerText = (i + 1) + ") Practice";
        question.innerText = data[i].question;
        if(data[i].isDone && info.lastDone !== i) {
            icon_child.className = "fas fa-check-circle done";
            li.setAttribute('question_key', data[i].key)
        }else if(info.lastDone === i) {
            li.classList.add('unlock');
            icon_child.className = "fas fa-unlock";
            li.setAttribute('question_key', data[i].key)
        }else{
            li.classList.add('locked')
            icon_child.className = "fas fa-lock lock";
        }
        icon.appendChild(icon_child);
        li.appendChild(name);
        li.appendChild(question);
        li.appendChild(icon);
        ul.appendChild(li);
    }

    moduleItems.getElementsByTagName('ul')[0].remove();
    moduleItems.appendChild(ul);
}