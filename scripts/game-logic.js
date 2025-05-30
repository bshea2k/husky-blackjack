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
        this.deck = [];
    }

    hit(card) {
        this.deck.push(card);
    }

    // MAKE IT WHERE ACES COUNT AS 1 AND 11
    get total() {
        let total = 0;

        for (let i = 0; i < this.deck.length; i++) {
            if (this.deck[i].value === "ACE") {
                total += 1;
                continue;
            }
            else if (this.deck[i].value === "JACK" || this.deck[i].value === "QUEEN" || this.deck[i].value === "KING") {
                total += 10;
                continue;
            }

            total += parseInt(this.deck[i].value);
        }

        return total;
    }
}

async function main() {
    const deck = await new Deck().init();
    let card = await deck.drawCard();
    console.log(card.code);

    const player = new Player();
    card = await deck.drawCard();
    player.hit(card);
    console.log(card.value);
    console.log(player.total);
    card = await deck.drawCard();
    player.hit(card);
    console.log(card.value);
    console.log(player.total);
}

main();