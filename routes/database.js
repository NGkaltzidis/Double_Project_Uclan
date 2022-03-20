/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
    apiKey: "AIzaSyALcMVW4XW8RoTeBEDml8IO4Sf0uKk4vxk",
    authDomain: "double-d713e.firebaseapp.com",
    projectId: "double-d713e",
    storageBucket: "double-d713e.appspot.com",
    messagingSenderId: "443434717693",
    appId: "1:443434717693:web:11d665c090221561cd8994"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

module.exports = app ;