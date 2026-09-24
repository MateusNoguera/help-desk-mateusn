import express from "express";
import { createTicket, deleteTicket, getTickets, getTicketsById, updateTicketStatus } from "../controllers/ticketsController.js";

const router = express.Router();

router.get("/", getTickets);

router.get("/:id", getTicketsById);

router.post("/", createTicket);

router.patch("/:id", updateTicketStatus);

router.delete("/:id", deleteTicket);

export default router;