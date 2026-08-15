import { Request, Response } from 'express';
import { analyzeTicket } from '../services/ai.service.js';
import { generateEmbedding } from '../ai/embedding.js';

export const aiTestController = async (req: Request, res: Response) => {
    try {
        const result = await analyzeTicket(
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

export const testEmbedding = async (req: Request, res: Response) => {
    try {
        const text1 = "Money was deducted but my order wasn't created.";

        const text2 = "I was charged for my purchase but never received my order.";

        const text3 = "I forgot my password and cannot log into my account.";

        const embedding1 = await generateEmbedding(text1);
        const embedding2 = await generateEmbedding(text2);
        const embedding3 = await generateEmbedding(text3);

        const similarity12 = cosineSimilarity(embedding1, embedding2);
        const similarity13 = cosineSimilarity(embedding1, embedding3);

        console.log("Test 1:", similarity12);
        console.log("Test 2:", similarity13);

        return res.status(200).json({
            success: true,
            data: {
                similarity12,
                similarity13
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const cosineSimilarity = (a: number[], b: number[]) => {
    if(a.length !== b.length) {
        throw new Error("Vectors must be of the same length");
    }

    const dotProduct = a.reduce((sum, val, i) => {
        return sum + val * b[i];
    }, 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if(magnitudeA === 0 || magnitudeB === 0) {
        throw new Error("Magnitude of one or both vectors is zero");
    }

    return dotProduct / (magnitudeA * magnitudeB);
}