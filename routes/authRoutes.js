import express from "express";
import { login, getCurrentUser } from "../controllers/authController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/login", login);

router.get("/me", authenticate, getCurrentUser);

export default router;