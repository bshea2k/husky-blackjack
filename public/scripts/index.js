// TO DO
// - Accessibility: add a tooltip when users hover over a disabled button saying to login to access this feature

const multiplayerButton = document.querySelector("#multiplayer-btn");
const privateButton = document.querySelector("#private-btn");

document.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            enableMultiplayer();
        } 
    });

    multiplayerButton.addEventListener("click", openMultiplayerPopup);

    const multiplayerPopupExit = document.querySelector(".multiplayer-join__exit");
    multiplayerPopupExit.addEventListener("click", closeMultiplayerPopup);

}

function enableMultiplayer() {
    multiplayerButton.disabled = false;
    multiplayerButton.classList.remove("button--disabled");
    privateButton.disabled = false;
    privateButton.classList.remove("button--disabled");
}

function openMultiplayerPopup() {
    const multiplayerPopup = document.querySelector(".multiplayer-join");
    multiplayerPopup.classList.remove("multiplayer-join--hidden");
}

function closeMultiplayerPopup() {
    const multiplayerPopup = document.querySelector(".multiplayer-join");
    multiplayerPopup.classList.add("multiplayer-join--hidden");
}