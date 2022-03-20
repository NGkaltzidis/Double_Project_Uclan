/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

let lobby_log = document.getElementById('lobby_log');
let chat_doc = document.getElementById('chat')
let chat_msg = document.getElementById('chat_msg');
let sent = document.getElementById('sent');
let cancel = document.getElementById('cancel');
let enemy_join = false;
let start = document.getElementById('start');

localStorage.setItem('session_id', sessionID);

// Check if start button exists on a player
if(start) {
    start.addEventListener('click', () => {
        // Check if enemy is joined
        if(enemy_join) {
            // Start game
            socket.emit('game_started', sessionID);
            enemy_join = false;
        }
    })
}

// Get rejection by user from server
socket.on('user_reject_invitation', data => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        document.getElementById('lobby_log').innerText = data.name + ' decline the request';
        start.style.display = 'none';
        cancel.style.display = 'none';
    }
})

// Countdown socket before game starts
socket.on('countdown', data => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        document.getElementById('lobby_log').innerText = 'Game Starting in ' + data.countdown;
    }
})

// Launch game
socket.on('start_game', (data) => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        document.getElementsByClassName('container')[0].style.display = 'none';
        document.getElementsByClassName('task')[0].style.display = 'block';
    }
})

// End game
socket.on('game_over', (data) => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        document.getElementsByClassName('container')[0].style.display = 'flex';
        document.getElementsByClassName('task')[0].style.display = 'none';
        document.getElementById('lobby_welcome').style.display = 'none';
        document.getElementById('lobby_end').style.display = '';
    }
})

// Game socket countdown
socket.on('time_left', data => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        document.getElementById('time_left').innerHTML = "<i class=\"fas fa-clock\"></i> " + data.time;
    }
})

// Update score
socket.on('score', data => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        document.getElementById('score').innerText = data.score;
        document.getElementById('score_end').innerText = data.score;
    }
})

// On task load - update score
document.getElementById('task').onload = function () {
    this.contentWindow.addEventListener('updateScore', function () {
        socket.emit('update_score', {
            user_id: uid,
            session_id: sessionID
        });
    });
}

// Inform server that user has joined the session
socket.emit('user_join_session', {
    user_id: uid,
    session_id: sessionID
});

// Receive from server that opponent joined
socket.on('opponent_joined', (data) => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        enemy_join = true;
        lobby_log.innerText = data.name + " Joined!"
    }
})

// Opponents chat
socket.on('chat_response', data => {
    // Check if sessions match
    if(data.session_id === sessionID) {
        let chat = document.createElement('div');
        let msg = document.createElement('div');
        chat.classList.add('enemy_chat');
        msg.classList.add('enemy_msg');
        msg.innerText = data.msg;

        chat.appendChild(msg);
        chat_doc.appendChild(chat);

        chat.scrollIntoView();
    }
})

// Sent message button
sent.addEventListener('click', sentMsg)

// Sent message with "Enter" key onclick
chat_msg.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        sentMsg();
    }
})

// Sent message value to the server
function sentMsg() {
    let chat = document.createElement('div');
    let msg = document.createElement('div');

    // Prevent sending empty message
    if(chat_msg.value.trim() !== "") {
        chat.classList.add('my_chat');
        msg.classList.add('my_msg');
        msg.innerText = chat_msg.value;

        chat.appendChild(msg);
        chat_doc.appendChild(chat);

        chat.scrollIntoView();

        socket.emit('live_chat', {
            user_id: uid,
            session_id: sessionID,
            msg: chat_msg.value
        });

        chat_msg.value = "";
    }
}

// Destroy session when match is over || user left
socket.on('session_destroy', data => {
    if(data.session_id === sessionID) {
        lobby_log.innerText = data.name + " has left!"
        document.getElementById('status').innerText = data.name + " has left!";
        document.getElementById('score_end').innerText = data.score;
    }
})

// Cancel button onclick redirect to
if(cancel) {
    cancel.addEventListener('click', () => {
        window.location.assign('/multiplayer')
    })
}
