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

const hitButton = document.querySelector("#hit-btn");
const standButton = document.querySelector("#stand-btn");

window.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded() {
    // initialize deck
    deck = await new Deck().init();

    // set up players
    const dealer = new Dealer();
    players.push(dealer);
    const player = new Player("#player-hand", "#player-score");
    players.push(player);

    // set up play buttons
    hitButton.addEventListener("click", async () => {
        disablePlayButtons();

        await delay(HIT_TIME);
        await dealCard(players[1]);
        if (!checkGameStatus()) enablePlayButtons();
    });

    standButton.addEventListener("click", async () => {
        disablePlayButtons();

        players[0].reveal();

        while (players[0].total < 17) {
            await delay(1000);
            await dealCard(players[0]);
            players[0].reveal();
        }

        checkWinner();
    });

    await newRound();
}

async function newRound() {
    // clear data from previous round
    await reset();

    // initialize game (deal cards to dealer and player)
    await initialize();

    // check to see if player or dealer have blackjacks
    checkGameStatus();

    enablePlayButtons();
}

async function reset() {
    // make the popup screen denoting new round go away
    const testingDiv = document.querySelector(".testing");
    testingDiv.innerHTML = "";

    // make the hit and stand buttons clickable again
    enablePlayButtons();

    // clear dealer and players hands and shuffle deck
    players[0].clearHand();
    players[1].clearHand();
    await deck.shuffle();
}

async function initialize() {
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < players.length; j++) {
            await dealCard(players[j]);
            await delay(HIT_TIME);
        }
    }
}

async function dealCard(user) {
    const card = await deck.drawCard();

    user.hit(card)
}

/*
make it less spaghetti code
make the new round screen a pop up with blacked out background
*/
// return true if game over, false otherwise
function checkGameStatus() {
    const dealerTotal = players[0].total;
    const playerTotal = players[1].total;
    const testingDiv = document.querySelector(".testing") //temp
    const statusHeader = document.createElement("h2"); //temp
    testingDiv.append(statusHeader); //temp

    if (dealerTotal === 21 || playerTotal === 21 || playerTotal > 21 || dealerTotal > 21) {
        if (dealerTotal === 21) {
            players[0].reveal();

            if (playerTotal === 21) {
                statusHeader.textContent = "Push";
            } else {
                statusHeader.textContent = "Dealer Win"
            }
        } else if (playerTotal === 21) {
            statusHeader.textContent = "Player Win"
        }

        if (playerTotal > 21) {
            players[0].reveal();
            statusHeader.textContent = "Player Bust";
        }
        if (dealerTotal > 21) {
            players[0].reveal();
            statusHeader.textContent = "Dealer Bust";
        }

        const newRoundButton = document.createElement("button"); //temp
        newRoundButton.classList.add("testing__button"); //temp
        newRoundButton.textContent = "New round"; //temp
        testingDiv.appendChild(newRoundButton); //temp

        disablePlayButtons();

        newRoundButton.addEventListener("click", newRound);
        return true;
    }

    return false;
}

function checkWinner() {
    const dealerTotal = players[0].total;
    const playerTotal = players[1].total;
    const testingDiv = document.querySelector(".testing") //temp
    const statusHeader = document.createElement("h2"); //temp
    testingDiv.append(statusHeader); //temp

    if (dealerTotal > 21) {
        statusHeader.textContent = "Dealer Bust";
    } else if (dealerTotal > playerTotal) {
        statusHeader.textContent = "Dealer Win";
    } else if (dealerTotal < playerTotal) {
        statusHeader.textContent = "Player win";
    } else {
        statusHeader.textContent = "Push";
    }

    const newRoundButton = document.createElement("button"); //temp
    newRoundButton.classList.add("testing__button"); //temp
    newRoundButton.textContent = "New round"; //temp
    testingDiv.appendChild(newRoundButton); //temp

    disablePlayButtons();

    newRoundButton.addEventListener("click", newRound);
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

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function disablePlayButtons() {
    hitButton.disabled = true;
    standButton.disabled = true;
}

function enablePlayButtons() {
    hitButton.disabled = false;
    standButton.disabled = false;
}