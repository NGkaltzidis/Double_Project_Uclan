let notifications = document.getElementById('notification');
let side_navBtn = document.getElementById('side_btn');
let dropdown_btn = document.getElementById('dropdown');
let side_nav = document.getElementById('side_nav');
const socket = io();

// Sent user online with user id
socket.emit('online', uid);

// When user has been invited - show notification
socket.on('invite', data => {
    let div = document.createElement("div");
    div.classList.add('notification_invite');
    div.innerHTML = " <h3>"+ data.name +" invited you to play!</h3>\n" +
        "        <div class=\"not_buttons\">\n" +
        "            <button onclick='rejectSession(\""+data.session_id+"\")' id=\"not_decline\">Decline</button>\n" +
        "            <button onclick='joinSession(\""+data.session_id+"\")' id=\"not_accept\">Accept</button>\n" +
        "        </div>";

    notifications.appendChild(div);
    // Set timeout for the notification to slide in
    setTimeout(() => {
        div.classList.add('active');
    }, 1000);

    // Slide out notification
    let hide = setTimeout(() => {
        div.classList.remove('active');
        socket.emit("reject_invitation", {
            session_id: data.session_id,
            user_id: uid
        })
    }, 15000);

    // Remove notification
    let remove = setTimeout(() => {
        div.remove();
    }, 16000)

    div.addEventListener('click', event => {
        if(event.target.matches('#not_decline')) {
            clearTimeout(hide);
            clearTimeout(remove);
            div.classList.remove('active');
            setTimeout(() => {
                div.remove();
            }, 1000)
        }
    })
})

// Get session
function joinSession(session_id) {
    setCookie("session_id", session_id, 1);
    window.location.assign('/multiplayer/session?id=' + session_id);
}

function rejectSession(session_id) {
    socket.emit("reject_invitation", {
        session_id: session_id,
        user_id: uid
    })
}

function errorNotifications(error) {
    let div = document.createElement("div");
    div.classList.add('notification_invite');
    div.innerHTML = " <p>Error: " + error + "</p>"

    notifications.appendChild(div);
    // Set timeout for the notification to slide in
    setTimeout(() => {
        div.classList.add('active');
    }, 1000);

    // Slide out notification
    setTimeout(() => {
        div.classList.remove('active');
    }, 5000);

    // Remove notification
    setTimeout(() => {
        div.remove();
    }, 6000)
}

// dropdown content
dropdown_btn.onclick = function () {
    let drop = document.getElementById('drop_content');

    // Check if dropdown is hidden and make it visible onclick
    if(drop.style.visibility === 'hidden') {
        drop.style.visibility = 'visible';
        drop.style.maxHeight = '1000px'
        drop.style.overflow = 'inherit'
        return;
    }

    // else hide
    drop.style.visibility = 'hidden';
    drop.style.maxHeight = ''
    drop.style.overflow = ''
}

// Side dropdown
side_navBtn.onclick = function () {
    if(side_nav.style.display === 'none') {
        side_nav.style.display = 'block'
        return;
    }

    side_nav.style.display = 'none'
}

// Trigger hide navbar when clicked elsewhere
window.onclick = function (event) {
    let drop = document.getElementById('drop_content');
    if(!event.path.includes(document.querySelector('.nav_dropdown'))) {
        drop.style.visibility = 'hidden';
        drop.style.maxHeight = ''
        drop.style.overflow = ''
        side_nav.style.display = 'none'
    }
}