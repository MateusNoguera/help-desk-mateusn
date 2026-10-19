import express from "express";
import { createUser, getUsers, updateUserRole, getAssignableUsers, updateOwnPassword } from "../controllers/usersController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.post("/", createUser);

router.get("/", authenticate, authorize("ADMIN"), getUsers);

router.patch("/me/password", authenticate, updateOwnPassword);

router.get("/assignable", authenticate, authorize("SUPPORT", "ADMIN"), getAssignableUsers);

router.patch("/:id/role", authenticate, authorize("ADMIN"), updateUserRole);

export default router;