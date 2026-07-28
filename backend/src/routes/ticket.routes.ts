import express from 'express';
import {authenticateToken} from '../middleware/auth.middleware.js';
import { createTicket, getTickets, getTicketById, updateTicket, deleteTicket } from '../controllers/ticket.controller.js';

const router = express.Router();

router.post('/', authenticateToken, createTicket);
router.get('/', authenticateToken, getTickets);
router.get("/:id", authenticateToken, getTicketById);
router.patch("/:id", authenticateToken, updateTicket);
router.delete("/:id", authenticateToken, deleteTicket);

export default router;