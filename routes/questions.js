/*
    Student: Nikolaos Gkaltzidis
    email: ngkaltzidis@uclan.ac.uk
    Registration number: G20794185
 */

const express = require('express');
const Auth = require("./Auth");
const {ref, set, getDatabase, get, child} = require("firebase/database");
const firebase = require("./database");
const router = express.Router();
const db = getDatabase(firebase);

// Insert new question
router.post('/new', (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,user => {
        // Check if user is admin
        if(user.extra.admin) {
            // Insert new question
            insertQuestion(req.body.question).then(r => {
                res.status(200).json(r);
            }).catch(err => {
                // Firebase error
                res.status(err.status).json(err.error)
            })
        }else {
            // If user not admin - authentication required
            res.status(403).json({
                error: "Authentication required"
            })
        }
    }, () => {
        // If user is logged out - authentication required
        res.status(403).json({
            error: "Authentication required"
        })
    })
})

// Edit existing question
router.post('/edit' , (req, res) => {
    // Check if user is logged in
    Auth.checkIfUserIsLoggedIn(req,user => {
        // Check if user is admin
        if(user.extra.admin) {
            // Update question
            updateQuestion(req.body.question).then(r => {
                res.status(200).json(r);
            }).catch(err => {
                // Update Error
                res.status(err.status).json(err.error);
            });
        }else {
            // If user is not admin - authentication required
            res.status(403).json({
                error: "Authentication required"
            })
        }
    }, () => {
        // If user is not logged in - authentication required
        res.status(403).json({
            error: "Authentication required"
        })
    })
})

// Delete question
router.post('/delete', (req, res) => {
    // If user is logged in
    Auth.checkIfUserIsLoggedIn(req,user => {
        // Check if user is admin
        if (user.extra.admin) {
            // Delete question
            deleteQuestion(req.body.key).then(r => {
                res.status(200).json(r);
            }).catch(err => {
                // Delete error
                res.status(err.status).json(err.error);
            })
        } else {
            // If user is not admin - authentication required
            res.status(403).json({
                error: "Authentication required"
            })
        }
    }, () => {
        // If user is not logged in - authentication required
        res.status(403).json({
            error: "Authentication required"
        })
    })

})

// Get Question by id
function getQuestion(id) {
    return new Promise((resolve, reject) => {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `questions/${id}`)).then((snapshot) => {
            // If question exists
            if (snapshot.exists()) {
                // Sent question
                resolve(snapshot.val());
            }else {
                // Error - question not found
                reject({
                    status: 404,
                    error: 'Question not found'
                })
            }
        }).catch((error) => {
            // Firebase error
            reject({
                status: 500,
                error: error
            });
        });
    })
}

// Get next question
function getNextQuestion(key) {
    return new Promise((resolve, reject) => {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `questions/${key}`)).then((snapshot) => {
            // If question exists
            if (snapshot.exists()) {
                // Sent question
                resolve(key);
            }else{
                // Question not found
                reject({
                    status: 404,
                    error: "Question not found"
                });
            }
        }).catch((error) => {
            // Firebase error
            reject({
                status: 500,
                error: error
            });
        });
    })
}

// Get all questions
function getAllQuestions() {
    return new Promise((resolve, reject) => {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `questions`)).then((snapshot) => {
            let keys = [];
            snapshot.forEach(function(item) {
                var itemVal = item.val();
                itemVal['key'] = item.key;
                keys.push(itemVal);
            });
            resolve(keys);
        }).catch((error) => {
            // Firebase error
            reject({
                status: 500,
                error: error
            });
        });
    })
}

// Insert Question
function insertQuestion(json) {
    return new Promise((resolve, reject) => {
        // Find last added question
        getQuestionsLength().then(length => {
            set(ref(db, 'questions/' + length), json).then(d => {
                // Sort questions
                sortData().then(() => {
                    resolve(d);
                }).catch(err => {
                    reject({
                        status: err.status,
                        error: err.error
                    })
                });
            }).catch(err => {
                // Firebase error
                reject({
                    status: 500,
                    error: err
                });
            });
        })
    })
}

// Update question
function updateQuestion(json) {
    return new Promise((resolve, reject) => {
        // Check if question exists
        getQuestion(json.key).then(question => {
            // Update question
            set(ref(db, 'questions/' + json.key), json).then(d => {
                // Sort question
                sortData().then(() => {
                    resolve(d);
                }).catch(err => {
                    reject({
                        status: err.status,
                        error: err.error
                    })
                });
            }).catch(err => {
                // Firebase error
                reject({
                    error: err,
                    status: 500
                });
            });
        }).catch(err => {
            // If question not exists
            reject({
                status: err.status,
                error: err
            })
        })
    })
}

// Delete question
function deleteQuestion(key) {
    return new Promise((resolve, reject) => {
        // Check if question exists
        getQuestion(key).then(question => {
            // Delete question
            set(ref(db, 'questions/' + key), null).then(d => {
                sortData().then((res) => {
                    resolve(res);
                }).catch(err => {
                    // Firebase sort error
                    reject({
                        status: err.status,
                        error: err.error
                    });
                });
            }).catch(err => {
                // Firebase set error
                reject({
                    status: 500,
                    error: err
                });
            });
        }).catch(err => {
            // If question not exists
            reject({
                status: err.status,
                error: err.error
            })
        })
    })
}

// Sort questions
function sortData() {
    return new Promise((resolve, reject) => {
        // Get all questions
        getAllQuestions().then(data => {
            // Sort
            data = data.sort(function(a, b){
                return a.difficulty - b.difficulty;
            });


            // Delete questions
            set(ref(db, 'questions'), null).catch(err => {
                reject({
                    status: 500,
                    err: err.error
                })
            });


            // Insert sorted questions
            for(let i = 0; i < data.length; i++) {
                set(ref(db, 'questions/' + i), data[i]).catch(err => {
                    reject({
                        status: 500,
                        error: err
                    })
                });
            }


            resolve(data);
        }).catch(err => {
            // Firebase error
            reject({
                status: err.status,
                error: err.error
            })
        })
    })
}

// Get number of questions available
async function getQuestionsLength() {
    return await new Promise(resolve => {
        const dbRef = ref(getDatabase());
        // Get all questions
        get(child(dbRef, `questions`)).then((snapshot) => {
            // Return size
            resolve(snapshot.size);
        });
    })
}

module.exports = {router, getQuestion, getAllQuestions, getQuestionsLength, getNextQuestion}