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
    }

    hit(card) {
        this.hand.push(card);

        currentUserDoc.update({
            cards: firebase.firestore.FieldValue.arrayUnion(`${card.value} ${card.suit.toLowerCase()}`),
            score: this.total
        });
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

        roomDoc.update({
            dealerCards: firebase.firestore.FieldValue.arrayUnion(`${card.value} ${card.suit.toLowerCase()}`),
            dealerScore: this.total,
            dealerHiddenScore: this.hiddenTotal
        });
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
let player;
let dealer;

const app = firebase.app();
const db = firebase.firestore();
const url = new URLSearchParams(window.location.search);
let hostUid;

const roomCode = url.get("room-code");
let currentUser;
let gamesRef;
let roomDoc;
let playersRef;
let currentUserDoc;
let dealerDoc;

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

    // set up dealer & firestore
    await initializeDealer();

    //initialize deck (only host sets deck)
    if (hostUid === currentUser.uid) {
        deck = await new Deck().init();
        roomDoc.update({deckId: deck.deckId});
    }
    deck = new Deck(deck.deckId);

    // set up syncing
    await initializeSync();

    // set up play buttons
    initializePlayButtons();

    // new round
    await newRound();
}

async function initializeRoomData() {
    gamesRef = db.collection("games");
    const roomQuery = await gamesRef.where("roomCode", "==", roomCode).get();

    roomDoc = await roomQuery.docs[0].ref;
    playersRef = roomDoc.collection("players");

    await firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
    })

    player = new Player(`#multiplayer-hand__cards--${currentUser.uid}`, `#multiplayer-hand__score--${currentUser.uid}`);

    await roomDoc.get().then(async doc => {
        const data = doc.data();
        hostUid = data.hostUid;
    })
}

async function dealCard(user) {
    const card = await deck.drawCard();

    user.hit(card)
}

function openRestrictedPopup() {
    const popup = document.querySelector(".multiplayer-restricted");
    popup.classList.remove(".multiplayer-restricted--hidden");
}

function initializePlayButtons() {
    hitButton.addEventListener("click", async () => {
        // deal a card to current user
        disablePlayButtons();
        await delay(HIT_TIME);
        await dealCard(player);
        // check to see if they have bust
        // - if bust, end their turn
        // - if not bust, enable buttons
        enablePlayButtons();
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

async function initializeDealer() {
    if (currentUser.uid === hostUid) {
        dealer = new Dealer();

        await roomDoc.update({
            dealerCards: [],
            dealerScore: 0,
            dealerHiddenScore: 0
        })
    }
}

async function initializeSync() {
    // attach a snapshot listener for each user, updates their zones when their record gets update
    playersRef.get().then((docs) => {
        docs.forEach((doc) => {
            const playerRef = doc.ref;

            playerRef.onSnapshot((snapshot) => {
                const data = snapshot.data();
                const cardsData = data.cards;

                const cardZone = document.querySelector(`.multiplayer-hand__cards--${data.uid}`);
                const scoreCounter = document.querySelector(`.multiplayer-hand__score--${data.uid}`);

                if (cardsData.length > 0) {
                    const cardWords = cardsData[cardsData.length - 1].split(" ");
                    const cardElement = makeCardElement(cardWords[0], cardWords[1]);
                    
                    cardZone.appendChild(cardElement);
                    scoreCounter.textContent = data.score;
                }
            })
        })
    })

    roomDoc.onSnapshot(doc => {
        const data = doc.data();
        const cardsData = data.dealerCards;

        const cardZone = document.querySelector(`#dealer-hand`);
        const scoreCounter = document.querySelector(`#dealer-score`);

        if (cardsData.length > 0) {
            const cardWords = cardsData[cardsData.length - 1].split(" ");
            const cardElement = makeCardElement(cardWords[0], cardWords[1]);
            
            if (cardsData.length === 1) {
                cardElement.classList.add("card--hidden");
            }        

            cardZone.appendChild(cardElement);
            scoreCounter.textContent = data.dealerHiddenScore;
        }
    })
}

async function newRound() {
    // - reset hands
    // - remove popup
    // - deal cards to dealer and players
    await initialDeal();

    // - checkgamestatus (if any players or dealers have bust)
    // - enable play buttons
    enablePlayButtons();
}

async function initialDeal() {
    if (currentUser.uid === hostUid) {
        for (let i = 0; i < 2; i++) {
            await delay(1000);
            await dealCard(dealer);
        }
    }

    for (let i = 0; i < 2; i++) {
        await delay(HIT_TIME);
        await dealCard(player);
    }
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

function makeCardElement(number, suit) {
    // create elements & assign classes
    const cardBlock = document.createElement("div");
    cardBlock.classList.add("card");
    cardBlock.classList.add(`card--${suit}`);

    const cardTopSection = document.createElement("div");
    cardTopSection.classList.add("card__top-section");

    const cardBottomSection = document.createElement("div");
    cardBottomSection.classList.add("card__bottom-section");

    const topNumber = document.createElement("span");
    topNumber.classList.add("card__number");

    const topSuit = document.createElement("span");
    topSuit.classList.add("card__suit");

    const bottomNumber = document.createElement("span");
    bottomNumber.classList.add("card__number");

    const bottomSuit = document.createElement("span");
    bottomSuit.classList.add("card__suit");

    // add content to elements
    let suitCode;

    if (suit === "hearts") suitCode = "&hearts;";
    else if (suit === "diamonds") suitCode = "&diams;";
    else if (suit === "clubs") suitCode = "&clubs;";
    else suitCode = "&#9824;";

    topNumber.textContent = number.slice(0, 1);
    if (number == 10) topNumber.textContent = 10;
    topSuit.innerHTML = suitCode;
    bottomNumber.textContent = number.slice(0, 1);
    if (number == 10) bottomNumber.textContent = 10;
    bottomSuit.innerHTML = suitCode;

    // append elements
    cardTopSection.appendChild(topNumber);
    cardTopSection.appendChild(topSuit);
    cardBottomSection.appendChild(bottomNumber);
    cardBottomSection.appendChild(bottomSuit);
    cardBlock.appendChild(cardTopSection);
    cardBlock.appendChild(cardBottomSection);

    return cardBlock;
}