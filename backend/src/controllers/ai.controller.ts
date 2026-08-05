import { Request, Response } from 'express';
import { classifyTicket } from '../services/ai.service.js';

export const aiTestController = async (req: Request, res: Response) => {
    try {
        const result = await classifyTicket(
            "Payment Failed",
            "Money deducted but order not placed."
        );
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};