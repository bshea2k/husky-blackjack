const app = firebase.app();
const db = firebase.firestore();
const url = new URLSearchParams(window.location.search);

const roomCode = url.get("room-code");
let gamesRef;
let roomQuery;
let playersRef;

document.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded() {
    console.log(roomCode); //temp
    await initializeRoomData();

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // start game stuff
        } else {
            openRestrictedPopup();
        }
    });

    // create multiplayer hand for each player already in database
    playersRef.get()
        .then(players => {
            players.forEach(doc => {
                data = doc.data();
                const multiplayerHand = makeMultiplayerHand(data.uid, data.displayName, data.photoURL);
                const multiplayerHands = document.querySelector(".multiplayer-hands");
                multiplayerHands.appendChild(multiplayerHand);
            })
        })
}

async function initializeRoomData() {
    gamesRef = db.collection("games");
    roomQuery = gamesRef.where("roomCode", "==", roomCode);

    await roomQuery.get().then((querySnapshot) => {
        const roomDoc = querySnapshot.docs[0];
        const roomRef = roomDoc.ref;
        playersRef = roomRef.collection("players");
    });
}

function openRestrictedPopup() {
    const popup = document.querySelector(".multiplayer-restricted");
    popup.classList.remove(".multiplayer-restricted--hidden");
}

function makeMultiplayerHand(uid, displayName, profileUrl) {
    // create elements and assign classes
    const multiplayerHand = document.createElement("div");
    multiplayerHand.classList.add("multiplayer-hand");
    //multiplayerHand.classList.add(`multiplayer-hand--${uid}`);
    const userInfo = document.createElement("div");
    userInfo.classList.add("multiplayer-hand__user-info");
    const icon = document.createElement("img");
    icon.classList.add("multiplayer-hand__icon");
    icon.setAttribute("src", profileUrl);
    icon.setAttribute("alt", "Profile picture icon");
    const name = document.createElement("p");
    name.classList.add("multiplayer-hand__name");
    const score = document.createElement("span");
    score.classList.add("multiplayer-hand__score");
    score.classList.add(`multiplayer-hand__score--${uid}`);
    const cards = document.createElement("div");
    cards.classList.add("multiplayer-hand__cards");
    cards.classList.add(`multiplayer-hand__cards--${uid}`);

    // add content to elements
    name.textContent = `${displayName}: `;
    score.textContent = "0";

    // append elements
    multiplayerHand.appendChild(userInfo);
    userInfo.appendChild(icon);
    name.appendChild(score);
    userInfo.appendChild(name);
    multiplayerHand.appendChild(cards);
    // return

    return multiplayerHand;
}