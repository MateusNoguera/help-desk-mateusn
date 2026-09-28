import express from "express";
import { createTicket, deleteTicket, getTickets, getTicketsById, updateTicketStatus } from "../controllers/ticketsController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.get("/", authenticate, getTickets);

router.get("/:id", authenticate, getTicketsById);

router.post("/", authenticate, createTicket);

router.patch("/:id", authenticate, updateTicketStatus);

router.delete("/:id", authenticate, deleteTicket);

export default router;