/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

// Dropdown button element
let dropdown_btn = document.getElementById('dropdown');

// Set click event on dropdown button
dropdown_btn.onclick = function () {
    // Toggle visibility of dropdown list
    let drop = document.getElementById('drop_content');
    if(drop.style.visibility === 'hidden') {
        drop.style.visibility = 'visible';
        drop.style.maxHeight = '1000px'
        drop.style.overflow = 'inherit'
        return;
    }

    drop.style.visibility = 'hidden';
    drop.style.maxHeight = ''
    drop.style.overflow = ''
}


// Set click event on window
window.onclick = function (event) {
    // If clicked in an area not within dropdown content-> hide content
    let drop = document.getElementById('drop_content');
    if(!event.path.includes(document.querySelector('.nav_dropdown'))) {
        drop.style.visibility = 'hidden';
        drop.style.maxHeight = ''
        drop.style.overflow = ''
    }
}