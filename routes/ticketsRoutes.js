import express from "express";
import { createTicket, deleteTicket, getTickets, getTicketsById, updateTicket, claimTicket } from "../controllers/ticketsController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/", authenticate, getTickets);

router.get("/:id", authenticate, getTicketsById);

router.post("/", authenticate, createTicket);

router.patch("/:id/claim", authenticate, authorize("SUPPORT"), claimTicket);

router.patch("/:id", authenticate, authorize("SUPPORT", "ADMIN"), updateTicket);

router.delete("/:id", authenticate, authorize("ADMIN"), deleteTicket);

export default router;