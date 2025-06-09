/*
Purpose: index.js provides functionality of index.html (which is the home screen).
Specifically, it implements the following buttons: Singleplayer, Multiplayer, Create Private Room
*/

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

    // for when user types in room code for multiplayer mode
    const form = document.querySelector(".multiplayer-join__form");
    form.addEventListener("submit", handleJoinForm);
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

function handleJoinForm(event) {
    event.preventDefault();

    const roomCode = document.getElementById("room-code").value.trim().toUpperCase();

    if (!roomCode) {
        alert("Please enter a room code.");
        return;
    }

    const db = firebase.firestore();
    const auth = firebase.auth();

    // search for a game in the db with matching roomcode
    db.collection("games").where("roomCode", "==", roomCode).get()
        .then(async function (querySnapshot) {
            if (querySnapshot.empty) {
                alert("Room not found. Please check your code.");
                return;
            }

            // get the first match
            const gameDoc = querySnapshot.docs[0];
            const gameId = gameDoc.id;
            const gameData = gameDoc.data();
            
            // ensure the user is authenticated
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in to join a game.");
                return;
            }
            // reference to playerlist
            const playersRef = db.collection("games").doc(gameId).collection("players");
            const currentPlayersSnapshot = await playersRef.get();

            // check if the lobby is already full
            if (currentPlayersSnapshot.size >= gameData.players) {
                alert("This game lobby is already full.");
                return;
            }

            // write player into the database
            const playerRef = playersRef.doc(user.uid);

            return playerRef.set({
                displayName: user.displayName || "Player",
                profilePicture: user.photoURL || "",
                uid: user.uid,
                isHost: false
            }).then(() => {
                // redirect player to the game lobby 
                window.location.href = `./pages/game-lobby.html?room=${gameId}`;
            });
        })
        .catch(function (error) {
            console.error("Error checking room code:", error);
            alert("Something went wrong while joining the room.");
        });
}