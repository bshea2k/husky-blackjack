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
    constructor() {
        this.hand = [];
    }

    hit(card) {
        this.hand.push(card);
    }

    // MAKE IT WHERE ACES COUNT AS 1 AND 11
    // returns the value of current hand
    get total() {
        let total = 0;

        for (let i = 0; i < this.hand.length; i++) {
            if (this.hand[i].value === "ACE") {
                total += 1;
                continue;
            }
            else if (this.hand[i].value === "JACK" || this.hand[i].value === "QUEEN" || this.hand[i].value === "KING") {
                total += 10;
                continue;
            }

            total += parseInt(this.hand[i].value);
        }

        return total;
    }

    // returns the card at specified index of players hand
    getCard(index) {
        return this.hand[index];
    }
}
/*
class Game {
    constructor() {
        this.deck = null;
    }

    async init() {
        const deck = await new Deck().init();
        this.deck = deck;
    }

    async playRound() {
        
    }
} */

window.addEventListener("DOMContentLoaded", domLoaded);

async function domLoaded() {
    const deck = await new Deck().init();
    const dealer = new Player();
    const player = new Player();
    // initialize game (deal cards to dealer and player)
    await initialize(deck, dealer, player);

}

async function initialize(deck, dealer, player) {
    const dealerHand = document.querySelector("#dealer-hand");
    const playerHand = document.querySelector("#player-hand");

    const dealerCard1Element = document.createElement("p");
    const dealerCard1 = await deck.drawCard();
    dealer.hit(dealerCard1);
    dealerCard1Element.textContent = `${dealerCard1.suit} ${dealerCard1.value}`;
    dealerHand.appendChild(dealerCard1Element);

    const dealerCard2Element = document.createElement("p");
    const dealerCard2 = await deck.drawCard();
    dealer.hit(dealerCard2);
    dealerCard2Element.textContent = `${dealerCard2.suit} ${dealerCard2.value}`;
    dealerHand.appendChild(dealerCard2Element);

    const playerCard1Element = document.createElement("p");
    const playerCard1 = await deck.drawCard();
    player.hit(playerCard1);
    playerCard1Element.textContent = `${playerCard1.suit} ${playerCard1.value}`;
    playerHand.appendChild(playerCard1Element);

    const playerCard2Element = document.createElement("p");
    const playerCard2 = await deck.drawCard();
    player.hit(playerCard2);
    playerCard2Element.textContent = `${playerCard2.suit} ${playerCard2.value}`;
    playerHand.appendChild(playerCard2Element);
}