import express  from 'express';
import { aiTestController, testEmbedding } from '../controllers/ai.controller.js';

const router = express.Router();
router.get("/test", aiTestController);
router.get("/embedding-test", testEmbedding);

export default router;