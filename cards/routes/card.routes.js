import { Router } from "express";
import { getAllcards, createCard, getCardById, updateCard, deleteCard, getCardByUserId, likeUnlikeCard, changeBizNum } from "../services/dataAccessServicesCards.service.js";
import cardValidation from "../models/cardValidation.schema.js";
import { auth } from "../../middlewares/auth.js";
import { adminOnly, adminOrBizOnly, adminOrUser, userOnly } from "../../middlewares/userAuthentication.js";
import Card from "../models/cards.schema.js";


const cardsRouter = Router();

// getting all cards
cardsRouter.get("/", async (req, res) => {
    try {
        const getCards = await getAllcards();
        res.json(getCards);

    } catch (err) {
        res.status(400).send(err.message);
    }
});

// get the user's cards by his id
cardsRouter.get("/my-cards", auth, async (req, res) => {
    const user = req.user;
    const cardUserId = await getCardByUserId(user._id);

    if (!cardUserId) {
        res.status(401).send("Unauthorized user");

    } else {
        try {
            return res.json(cardUserId);
        } catch (err) {
            res.status(400).send(err.message);
        }
    }
});

// getting card by it's id
cardsRouter.get("/:id", async (req, res) => {
    try {
        const card = await getCardById(req.params.id);
        return res.json(card);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// creating a new card (only business users & admin)
cardsRouter.post("/", auth, adminOrBizOnly, async (req, res) => {
    const { error } = cardValidation.validate(req.body, { abortEarly: false });

    if (error) {
        res.status(400).json({ errors: error.details.map((e) => e.message) });
    }

    try {
        const data = req.body;
        data.userId = req.user._id;

        const card = await createCard(data);
        await card.save();
        res.json(card);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// updating card (only the user who created the card)
cardsRouter.put("/:id", auth, async (req, res) => {
    const { error } = cardValidation.validate(req.body, { abortEarly: false });
    const user = req.user;
    const cardUserId = await getCardByUserId(user._id);

    if (error) {
        res.status(400).json({ errors: error.details.map((e) => e.message) })
    }

    if (!cardUserId) {
        res.status(401).send("Unauthorized user");

    } else {
        try {
            const data = req.body;
            const card = await updateCard(req.params.id, data);
            res.json(card);
        } catch (err) {
            res.status(400).send(err);
        }
    }
});

// deleting the card (the user who created or admin)
cardsRouter.delete("/:id", auth, adminOrUser, async (req, res) => {
    const user = req.user;
    const card = await getCardById(req.params.id);

    if (!card) {
        return res.status(401).send("did not find card");

    } else if (user._id !== card.userId.toString() && !user.isAdmin) {
        res.status(401).send("Unauthorized user");

    } else {
        try {
            res.json(card);
            await deleteCard(card.id);
        } catch (err) {
            res.status(400).send(err);
        }
    }
});

// like/unlike a card
cardsRouter.patch("/:id", auth, async (req, res) => {
    const user = req.user;
    const card = await getCardById(req.params.id);

    if (!card) {
        res.status(400).send("card not found");

    } else {
        try {
            await likeUnlikeCard(card.id, user._id);
            res.json(card);
        } catch (err) {
            res.status(500).send(err.message);
        }
    }
});

cardsRouter.patch("/:id", auth, adminOnly, async (req, res) => {
    const card = await getCardById(req.params.id);

    if (!card) {
        res.status(400).send("card not found");
    } else {
        try {
            const data = req.params.body;
            await changeBizNum(card, data);
        } catch (err) {
            res.status(500).send(err.message);
        }
    }
});


export default cardsRouter;