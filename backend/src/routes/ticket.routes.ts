import express from 'express';
import {authenticateToken} from '../middleware/auth.middleware.js';
import { createTicket, getTickets, getTicketById, updateTicket, deleteTicket, regenerateReply, searchTickets } from '../controllers/ticket.controller.js';
import { createTicketSchema } from '../validation/ticket.schema.js';
import { validatorMiddleware } from '../middleware/validate.middleware.js';
import { ticketQuerySchema } from '../validation/ticketQuery.schema.js';

const router = express.Router();

router.post('/', authenticateToken, validatorMiddleware(createTicketSchema), createTicket);
router.get('/', authenticateToken,  validatorMiddleware(ticketQuerySchema, "query"), getTickets);
router.get("/search", authenticateToken, searchTickets);
router.get("/:id", authenticateToken, getTicketById);
router.patch("/:id", authenticateToken, updateTicket);
router.delete("/:id", authenticateToken, deleteTicket);
router.post("/:id/regenerate-reply", authenticateToken, regenerateReply);

export default router;