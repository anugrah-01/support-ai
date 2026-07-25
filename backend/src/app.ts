import express from 'express';
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK",
    message: "SupportAI backend running"
 });
});

app.use('/api/auth', authRoutes);

export default app;
