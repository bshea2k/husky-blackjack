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

    async hit(deckId) {
        const res = await fetch (`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
        const data = await res.json();

        this.hand.push(data.cards[0]);
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
}

async function main() {
    
}

main();