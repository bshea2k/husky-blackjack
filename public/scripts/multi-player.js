document.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // start game stuff
        } else {
            openRestrictedPopup();
        }
    });
}

function openRestrictedPopup() {
    const popup = document.querySelector(".multiplayer-restricted");
    popup.classList.remove(".multiplayer-restricted--hidden");
}