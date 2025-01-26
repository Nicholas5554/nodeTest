import { Router } from "express";
import { getUserById, getAllUsers, createUser, updateUser, deleteUser, changeAuthLevel } from "../services/dataAccessServicesUser.service.js";
import userValidation from "../models/userValidation.schema.js";
import { validate } from "../../middlewares/validation.js";
import loginSchema from "../validations/loginSchema.js";
import registerSchema from "../validations/registerSchema.js";
import User from "../models/user.schema.js";
import { comparePassword, hashPassword } from "../services/password.service.js";
import { generateToken } from "../../services/auth.service.js";
import { auth } from "../../middlewares/auth.js";
import { adminOnly, adminOrUser, userOnly } from "../../middlewares/userAuthentication.js";

const userRouter = Router();

// getting all the users (only for admin)
userRouter.get("/", auth, adminOnly, async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// register a new user / add a new user to the database
userRouter.post("/register", validate(registerSchema), async (req, res) => {
    const { error, values } = userValidation.validate(req.body, { abortEarly: false });

    if (error) {
        res.status(400).json({ errors: error.details.map((p) => p.message) })
    }

    try {
        const data = req.body;
        const newUser = await createUser(data, values);

        newUser.password = await hashPassword(newUser.password);

        await newUser.save();
        res.json(newUser);

    } catch (err) {
        return res.status(500).send(err)
    }
});

// login a user
userRouter.post("/login", validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        const token = generateToken(user);

        if (!user) {
            return res.status(404).send("invalid credentials");
        }

        const checkPassword = await comparePassword(password, user.password);

        if (!checkPassword) {
            user.loginAttempts += 1;
            await user.save();

            if (user.loginAttempts >= 3) {
                user.isBlocked = true;
                await user.save();
                user.blockedUntil = new Date().setTime() + 10000;
                return res.status(401).send("User is blocked");
            }
            return res.status(401).send("Invalid password");
        }
        else {
            user.loginAttempts = 0;
            user.isBlocked = false;
            await user.save();
            return res.send(token);
        }

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});



// getting a user by his id (registerd user or admin)
userRouter.get("/:id", auth, adminOrUser, async (req, res) => {
    try {
        const userById = await getUserById(req.params.id);
        return res.json(userById);
    } catch (err) {
        res.status(400).send(err.message);
    }
});


// updating a user by his id (the registered user only)
userRouter.put("/:id", auth, userOnly, validate(registerSchema), async (req, res) => {
    try {
        const data = req.body;

        if (data.password) {
            data.password = await hashPassword(data.password);
        }

        const updatedUser = await updateUser(req.params.id, data);
        return res.json(updatedUser);

    } catch (err) {
        res.status(500).send(err.message);
    }
});

// deleting a user by his id (only the registered user or admin)
userRouter.delete("/:id", auth, adminOrUser, async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        res.json(user);
        await deleteUser(req.params.id);

    } catch (err) {
        res.status(500).send(err.message)
    }
});

// changing the user's authentication level (only the registered user or admin)
userRouter.patch("/:id", auth, adminOrUser, async (req, res) => {
    try {
        const user = await changeAuthLevel(req.params.id);
        return res.json(user);
    } catch (err) {
        res.status(400).send(err.message)
    }
});

export default userRouter;