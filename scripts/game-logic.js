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
        
        const cardElement = document.createElement("p");
        cardElement.textContent = `${card.suit} ${card.value}`;
        let suitClass = `card--${card.suit}`;
        cardElement.classList.add(suitClass.toLowerCase());
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
        
        const cardElement = document.createElement("p");
        cardElement.textContent = `${card.suit} ${card.value}`;
        let suitClass = `card--${card.suit}`;
        cardElement.classList.add(suitClass.toLowerCase());

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
        await dealCard(players[1]);
        checkGameStatus();
    });

    standButton.addEventListener("click", async () => {
        players[0].reveal();

        while (players[0].total < 17) {
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

    hitButton.disabled = false;
    hitButton.disabled = false;
}

async function reset() {
    // make the popup screen denoting new round go away
    const testingDiv = document.querySelector(".testing");
    testingDiv.innerHTML = "";

    // make the hit and stand buttons clickable again
    hitButton.disabled = false;
    standButton.disabled = false;

    // clear dealer and players hands and shuffle deck
    players[0].clearHand();
    players[1].clearHand();
    await deck.shuffle();
}

async function initialize() {
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < players.length; j++) {
            await dealCard(players[j]);
        }
    }
}

async function dealCard(user) {
    const card = await deck.drawCard();

    user.hit(card);
}

/*
make it less spaghetti code
make the new round screen a pop up with blacked out background
*/
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

        hitButton.disabled = true;
        standButton.disabled = true;

        newRoundButton.addEventListener("click", newRound);
    }
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

    hitButton.disabled = true;
    standButton.disabled = true;

    newRoundButton.addEventListener("click", newRound);
}