import express from "express";
import { createUser, getUsers, updateUserRole } from "../controllers/usersController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.post("/", createUser);

router.get("/", authenticate, authorize("ADMIN"), getUsers);

router.patch("/:id/role", authenticate, authorize("ADMIN"), updateUserRole);

export default router;