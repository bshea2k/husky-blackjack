/*
Purpose: authentication.js uses Firebase's Authentication service so that users
can log in with their Google account. Once a user signs in the default profile icon
changes to their Google account's photo.
*/
window.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded() {
    const profileIcon = document.querySelector(".navigation__profile-icon");
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            profileIcon.setAttribute("src", user.photoURL);
            console.log(user);
        } else {
            console.log("not logged in");
        } 
    });
}

function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider)
        .then(result => {
            const user = result.user;
        })
        .catch(console.log)
}