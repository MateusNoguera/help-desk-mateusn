import express from "express";
import { createTicket, deleteTicket, getTickets, getTicketsById, updateTicketStatus } from "../controllers/ticketsController.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.get("/", authenticate, getTickets);

router.get("/:id", getTicketsById);

router.post("/", createTicket);

router.patch("/:id", updateTicketStatus);

router.delete("/:id", deleteTicket);

export default router;