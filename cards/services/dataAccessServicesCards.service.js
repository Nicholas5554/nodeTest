
import Card from "../models/cards.schema.js";


const getAllcards = async (allCards) => {
    try {

        const cards = Card.find(allCards);
        if (!cards) {
            throw new Error("cards not found");
        }
        return cards;

    } catch (err) {
        throw new Error(err)
    }
};

const getCardById = async (cardId) => {
    try {
        const card = await Card.findById(cardId);
        if (!card) {
            throw new Error("did not find card");
        }
        return card;

    } catch (err) {
        throw new Error(err.message);
    }
};

const getCardByUserId = async (userId) => {
    try {
        const card = await Card.find({ userId });
        if (!card) {
            throw new Error(`did not find the card with user id of ${userId}`);
        }
        return card;

    } catch (err) {
        throw new Error(err.message);
    }
};

const createCard = async (newCard) => {
    try {
        const card = new Card(newCard);
        card.bizNumber = Math.floor(Math.random() * 99 + 1);

        await card.save();
        if (!card) {
            throw new Error("card was not added");
        }
        return card;
    } catch (err) {
        throw new Error(err);
    }
};

const updateCard = async (cardId, updateData) => {
    try {
        const card = Card.findByIdAndUpdate(cardId, updateData, { new: true, runValidators: true });

        if (!card) {
            throw new Error("card was not added");
        }
        return card;

    } catch (err) {
        throw new Error(err);
    }
};

const deleteCard = async (cardId) => {
    try {
        const card = Card.findByIdAndDelete(cardId);

        if (!card) {
            throw new Error("card was not deleted");
        }
        return card;

    } catch (err) {
        throw new Error(err);
    }
};

const likeUnlikeCard = async (cardId, userId) => {
    try {
        const card = await Card.findById(cardId);

        if (!card) {
            throw new Error("card was not found");
        }

        const userIndex = card.likes.indexOf(userId);

        await Card.findByIdAndUpdate(
            cardId,
            { [userIndex > -1 ? '$pull' : '$addToSet']: { likes: userId } },
            { new: true }
        );
        return card;

    } catch (err) {
        throw new Error(err.message);
    }
};

const changeBizNum = async (cardId, updateBiz) => {
    try {
        const card = await Card.findByIdAndUpdate(cardId, updateCard, { bizNumber: updateBiz });
        if (!card) {
            throw new Error("card's biz number was not updated");
        }
        return card;

    } catch (err) {
        throw new Error(err.message)
    }
}

export { getAllcards, createCard, getCardById, updateCard, deleteCard, getCardByUserId, likeUnlikeCard, changeBizNum };