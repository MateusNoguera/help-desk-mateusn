import express from "express";
import { createTicket, deleteTicket, getTickets, getTicketsById, updateTicket } from "../controllers/ticketsController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/", authenticate, getTickets);

router.get("/:id", authenticate, getTicketsById);

router.post("/", authenticate, createTicket);

router.patch("/:id", authenticate, authorize("SUPPORT", "ADMIN"), updateTicket);

router.delete("/:id", authenticate, deleteTicket);

export default router;