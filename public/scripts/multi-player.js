class Deck {
    constructor(deckId) {
        this.deckId = deckId;
    }

    async init() {
        const res = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
        const data = await res.json();

        return new Deck(data.deck_id);
    }

    // shuffles the deck
    async shuffle() {
        const res = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/shuffle/`);
    }

    // draws a card, returns the card drawn
    async drawCard() {
        const res = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=1`);
        const data = await res.json();

        return data.cards[0];
    }
}

class Player {
    constructor(cardZone, scoreCounter) {
        this.hand = [];
        this.cardZone = document.querySelector(`${cardZone}`);
        this.scoreCounter = document.querySelector(`${scoreCounter}`)
    }

    hit(card) {
        this.hand.push(card);
        
        const cardElement = makeCardElement(card.value, card.suit.toLowerCase());
        this.cardZone.appendChild(cardElement);

        this.scoreCounter.textContent = this.total;
    }

    get total() {
        let lowTotal = 0;
        let highTotal = 0;

        for (let i = 0; i < this.hand.length; i++) {
            if (this.hand[i].value === "ACE") {
                lowTotal += 1;
                highTotal += 11;
                continue;
            }
            else if (this.hand[i].value === "JACK" || this.hand[i].value === "QUEEN" || this.hand[i].value === "KING") {
                lowTotal += 10;
                highTotal += 10;
                continue;
            }

            lowTotal += parseInt(this.hand[i].value);
            highTotal += parseInt(this.hand[i].value);
        }

        if (highTotal > 21) return lowTotal;
        else return highTotal;
    }

    // returns the card at specified index of players hand
    getCard(index) {
        return this.hand[index];
    }

    clearHand() {
        this.hand.length = 0;
        this.cardZone.innerHTML = "";
        this.scoreCounter.textContent = 0;
    }
}

class Dealer extends Player {
    constructor() {
        super()
        this.hand = [];
        this.cardZone = document.querySelector("#dealer-hand");
        this.scoreCounter = document.querySelector("#dealer-score")
    }

    hit(card) {
        this.hand.push(card);
        
        const cardElement = makeCardElement(card.value, card.suit.toLowerCase());

        if (this.hand.length == 1) {
            cardElement.classList.add("card--hidden");
        }

        this.cardZone.appendChild(cardElement);

        this.scoreCounter.textContent = this.hiddenTotal + "?";
    }

    get hiddenTotal() {
        let lowTotal = 0;
        let highTotal = 0;

        for (let i = 1; i < this.hand.length; i++) {
            if (this.hand[i].value === "ACE") {
                lowTotal += 1;
                highTotal += 11;
                continue;
            }
            else if (this.hand[i].value === "JACK" || this.hand[i].value === "QUEEN" || this.hand[i].value === "KING") {
                lowTotal += 10;
                highTotal += 10;
                continue;
            }

            lowTotal += parseInt(this.hand[i].value);
            highTotal += parseInt(this.hand[i].value);
        }

        if (highTotal > 21) return lowTotal;
        else return highTotal;
    }

    reveal() {
        const hiddenCard = this.cardZone.firstElementChild;
        hiddenCard.classList.remove("card--hidden");
        this.scoreCounter.textContent = this.total;
    }
}

const HIT_TIME = 250;
let deck;
const players = [];

const app = firebase.app();
const db = firebase.firestore();
const url = new URLSearchParams(window.location.search);

const roomCode = url.get("room-code");
let currentUser;
let gamesRef;
let roomDoc;
let playersRef;
let currentUserDoc;

const hitButton = document.querySelector("#hit-btn");
const standButton = document.querySelector("#stand-btn");

document.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded() {
    console.log(roomCode); //temp
    await initializeRoomData();

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // start game stuff
        } else {
            openRestrictedPopup();
            return;
        }
    });

    // set up players
    await initializePlayers();

    //initialize deck
    deck = await new Deck().init();
    roomDoc.update({deckId: deck.deckId});

    // set up play buttons
    initializePlayButtons();

    // new round
    await newRound();
}

async function initializeRoomData() {
    gamesRef = db.collection("games");
    const roomQuery = await gamesRef.where("roomCode", "==", roomCode).get();

    roomDoc = roomQuery.docs[0].ref;
    playersRef = roomDoc.collection("players");

    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
    })
}

function openRestrictedPopup() {
    const popup = document.querySelector(".multiplayer-restricted");
    popup.classList.remove(".multiplayer-restricted--hidden");
}

function initializePlayButtons() {
    hitButton.addEventListener("click", async () => {
        console.log("Hit") //temp
        // deal a card to current user
        // check to see if they have bust
        // - if bust, end their turn
        // - if not bust, nothing
    });

    standButton.addEventListener("click", async () => {
        console.log("Stand") //temp
        // go to next users turn
    });
}

async function initializePlayers() {
    playersRef.get()
        .then(players => {
            players.forEach(doc => {
                data = doc.data();
                const multiplayerHand = makeMultiplayerHand(data.uid, data.displayName, data.profilePicture);
                const multiplayerHands = document.querySelector(".multiplayer-hands");
                multiplayerHands.appendChild(multiplayerHand);
            })
        });
    
    const currentUserQuery = await playersRef.where("uid", "==", currentUser.uid).get();
    currentUserDoc = currentUserQuery.docs[0].ref;

    await currentUserDoc.update({cards: []});
    await currentUserDoc.update({score: 0});
    await currentUserDoc.update({ready: false});
}

async function newRound() {
    // - reset hands
    playersRef
    // - remove popup
    // - deal cards to dealer and players
    // - checkgamestatus (if any players or dealers have bust)
    // - enable play buttons
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function disablePlayButtons() {
    hitButton.disabled = true;
    standButton.disabled = true;
    hitButton.classList.add("game-btn--disabled");
    standButton.classList.add("game-btn--disabled");
}

function enablePlayButtons() {
    hitButton.disabled = false;
    standButton.disabled = false;
    hitButton.classList.remove("game-btn--disabled");
    standButton.classList.remove("game-btn--disabled");
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