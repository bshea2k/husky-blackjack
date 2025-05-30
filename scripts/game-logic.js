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
}

let deck;
const players = [];

window.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded() {
    deck = await new Deck().init();

    const dealer = new Player("#dealer-hand", "#dealer-score");
    players.push(dealer);
    const player = new Player("#player-hand", "#player-score");
    players.push(player);
    // initialize game (deal cards to dealer and player)
    await initialize();

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