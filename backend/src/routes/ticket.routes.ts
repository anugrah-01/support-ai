import express from 'express';
import {authenticateToken} from '../middleware/auth.middleware.js';
import { createTicket, getTickets } from '../controllers/ticket.controller.js';

const router = express.Router();

router.post('/', authenticateToken, createTicket);
router.get('/', authenticateToken, getTickets);

export default router;