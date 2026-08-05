import express  from 'express';
import { aiTestController } from '../controllers/ai.controller.js';

const router = express.Router();
router.get("/test", aiTestController);

export default router;