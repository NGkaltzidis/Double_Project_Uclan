let users;
let userid = document.querySelector("[user_id]").getAttribute('user_id');
let searchInput = document.getElementById('searchIpt');
let searchList = document.getElementsByClassName('searchList')[0];
let list = searchList.getElementsByTagName("ul")[0];
let players_count = document.getElementById('online_players');

// Get number of online players
socket.on('online_players', num => {
    players_count.innerText = "Online Players: " + num;
})

// Get created session
socket.on('session_created', session_id => {
    setCookie("session_id", session_id, 1);
    window.location.assign('multiplayer/session?id=' + session_id);
})

// Get players
socket.emit('get_players')
// Get available players
socket.on('available_players', data => {
    users = data;
})

// Users list
searchInput.onfocus = function () {
    searchList.style.display = 'block';
}

// Close users list when clicked outside
window.addEventListener('click', event => {
    // Check if click is not within the list / input
    if(!event.target.className.includes('searchList') && !event.target.id.includes('searchIpt')) {
        searchList.style.display = 'none';
    }
});

// Trigger on input event
searchInput.oninput = function () {
    searchUser(this.value.toLowerCase());
}

// Search users
function searchUser(val) {
    list.innerHTML = "";
    // Check if input is not empty
    if(val !== "") {
        // Go through each user
        for (let i = 0; i < users.length; i++) {
            let value = users[i];

            // Check if user id does not match the user logged in (do not display user into the list)
            if (value.uid != userid) {
                // Check if the input value matches user name / lastname / email
                if (value.name.toLowerCase().includes(val) || value.lastname.toLowerCase().includes(val) || value.email.toLowerCase().includes(val)) {
                    // Push list
                    list.innerHTML += ('<li onclick="createGame(\''+value.uid+'\')">' + value.name + " (" + value.email + ")" + '</li>');
                }
            }
        }

        // If input does not match list
        if(list.children.length === 0) {
            list.innerHTML = ('<li>No user found.</li>');
        }
    }
}

// Invite opponent
function createGame(uid) {
    // Sent server to invite opponent with user id
    socket.emit("invite_player", {
        current_user_id: userid,
        user_id: uid
    });
}

// Get list of recent games
function getGames() {
    fetch('/multiplayer/games')
        .then(
            function (response) {
                // Examine the text in the response
                if(response.status === 200) {
                    response.json().then(function (data) {
                        showRecentGames(data);
                    });
                }
                else {
                    // Show error
                    errorNotifications(data.res);
                }
            }
        )
        .catch(function (err) {
            // Show error
            errorNotifications(err);
        });

}

// Create recent games html element
function showRecentGames(data) {
    let games = document.getElementsByClassName('games_row')[0];
    games.innerHTML = ""

    for(let i = 0; i < data.length; i++) {
        let res = "<div class=\"game\">\n" +
            "           <div class='game_detail'>\n" +
            "               <div class=\"users\"><span class='user1'>"+ data[i][data[i].users.player1].name +"</span> - <span class='user2'>"+ data[i][data[i].users.player2].name +"</span></div>\n" +
            "               <div class=\"game_date\">"+ data[i].createdAt +"</div>\n" +
            "           </div>\n" +
            "           <div class=\"score\"><span class='user1_score'>"+ data[i][data[i].users.player1].score +"</span> - <span class='user2_score'>"+ data[i][data[i].users.player2].score +"</span></div>\n" +
            "      </div>";

        let doc = new DOMParser().parseFromString(res, 'text/html');

        if(data[i][data[i].users.player1].score > data[i][data[i].users.player2].score) {
            doc.querySelector('.user1').classList.add('win')
            doc.querySelector('.user2').classList.add('lost')
            doc.querySelector('.user1_score').classList.add('win')
            doc.querySelector('.user2_score').classList.add('lost')
        }else if(data[i][data[i].users.player1].score === data[i][data[i].users.player2].score) {
            doc.querySelector('.user1').classList.add('draw')
            doc.querySelector('.user2').classList.add('draw')
            doc.querySelector('.user1_score').classList.add('draw')
            doc.querySelector('.user2_score').classList.add('draw')
        }else{
            doc.querySelector('.user1').classList.add('lost')
            doc.querySelector('.user2').classList.add('win')
            doc.querySelector('.user1_score').classList.add('lost')
            doc.querySelector('.user2_score').classList.add('win')
        }

        games.innerHTML += doc.body.innerHTML;
    }
}