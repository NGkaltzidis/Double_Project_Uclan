/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

let container = document.getElementsByClassName('scoreboard')[0];
loadData();
setInterval(loadData, 10000)

function loadData() {
    fetch('/scoreboard/topten')
        .then(response => {
            response.json().then(data => {
                container.innerHTML = ""
                for (let i = 0; i < data.length; i++) {
                    if (i === 10) break;

                    container.innerHTML += `
                        <div class="users">
                            <div class="index">${i + 1}</div>
                            <div class="name">${data[i].name}  ${data[i].lastname}</div>
                            <div class="time">${data[i].time}</div>
                            <div class="score">${data[i].score} / ${data[i].questions}</div>
                        </div>`
                }

                for (let i = 0; i < data.length; i++) {
                    if (data[i].uid === uid) {
                        if (i < 10) {
                            document.getElementsByClassName('users')[i].classList.add('active')
                        } else {
                            container.innerHTML += `
                                <div class="users active">
                                    <div class="index">${data.length}</div>
                                    <div class="name">${data[i].name}  ${data[i].lastname}</div>
                                    <div class="time">${data[i].time}</div>
                                    <div class="score">${data[i].score} / ${data[i].questions}</div>
                                </div>`
                        }

                        break;
                    }
                }
            })
        })
}