window.addEventListener("DOMContentLoaded", domLoaded);

function domLoaded() {
    const form = document.querySelector("form");
    form.addEventListener("submit", handleGameCreation);
}

function handleGameCreation(event) {
    event.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("You must be logged in to create a game.");
        return;
    }

    const players = document.querySelector("#players").value;
    const hands = document.querySelector("#hands").value;
    // generate a random 5-digit room code
    const roomCode = generateRoomCode(5);

    const db = firebase.firestore();
    const gameData = {
        players: Number(players),
        hands: Number(hands),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "waiting",
        roomCode: roomCode,
        hostUid: user.uid
    };

    createGameWithHost(db, gameData, user);
}

function generateRoomCode(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function createGameWithHost(db, gameData, user) {
    // add to games collection from the database
    db.collection("games").add(gameData)
        .then(function (gameDocRef) {
            const playersRef = gameDocRef.collection("players").doc(user.uid);
            return playersRef.set({
                displayName: user.displayName || "Host",
                profilePicture: user.photoURL || "",
                uid: user.uid
            }).then(function () {
                // add to player subcollection with card and game data
                return playersRef.collection("playerData").add({
                    cards: [],
                    score: 0,
                    isHost: true,
                    ready: false
                }).then(function () {
                    console.log("Game, player, and player data created.");
                    window.location.href = `game-lobby.html?room=${gameDocRef.id}`;
                });
            });
        })
        .catch(function (error) {
            console.error("Error creating game or player data:", error);
            alert("Failed to create game. Please try again.");
        });
}