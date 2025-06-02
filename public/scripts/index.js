// TO DO
// - Accessibility: add a tooltip when users hover over a disabled button saying to login to access this feature

document.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            enableMultiplayer();
        } 
    });
}

function enableMultiplayer() {
    const multiplayerButton = document.querySelector("#multiplayer-btn");
    const privateButton = document.querySelector("#private-btn");

    multiplayerButton.disabled = false;
    multiplayerButton.classList.remove("button--disabled");
    privateButton.disabled = false;
    privateButton.classList.remove("button--disabled");
}