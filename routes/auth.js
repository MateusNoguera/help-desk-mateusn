import express from "express";
import { login } from "../controllers/authController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/login", login);

router.get("/me", authenticate, (req, res) => {
    return res.json({
        user: req.user
    });
});

export default router;