import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { generateEmbedding } from "../ai/embedding.js";
import { generateSupportReply } from "../services/ai.service.js";
import prisma from "../config/prisma.js";

const worker = new Worker( "ticket-processing", 
    async (job) => {
        console.log(`Processing job ${job.id} | Ticket ${job.data.ticketId} | Attempt ${job.attemptsMade + 1}`);
        const { ticketId } = job.data;
        console.log(`Ticket ID: ${ticketId}`);

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if(!ticket) {
            throw new Error(`Ticket with ID ${ticketId} not found`);
        }

        await prisma.ticket.update({
            where: {
                id: ticketId,
            },
            data: {
                aiStatus: "PROCESSING",
                aiError : null,
            },
        });

        console.log(`Ticket ${ticketId} is now PROCESSING`);

        const textToEmbed = `${ticket.title}\n${ticket.description}`;
        const embedding = await generateEmbedding(textToEmbed);
        console.log('embedding:' +embedding.length);

        const vectorString = `[${embedding.join(",")}]`;
        await prisma.$executeRaw `UPDATE "Ticket" SET "embedding" = ${vectorString}::vector WHERE "id" = ${ticket.id}`;

        const supportReply = await generateSupportReply(textToEmbed);
        await prisma.ticket.update({where: 
                                {id: ticket.id,},
                                data: {aiReply: supportReply,
                                       aiStatus: "COMPLETED",},
        });
        console.log(`Ticket ${ticketId} processed successfully`);
    },
    {
        connection: redisConnection,
        concurrency: 3,
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
    if(!job) {
        return;
    }

    const maxAttempts = job.opts.attempts ?? 1;
    const finalAttemptReached = job.attemptsMade >= maxAttempts;

    if (!finalAttemptReached) {
        console.log(`Ticket ${job.data.ticketId} will be retried.`);
        return;
    }

    try {
        await prisma.ticket.update({
            where: { id: job.data.ticketId },
            data: { 
                aiStatus: "FAILED",
                aiError: error.message
            },
        });
        console.log(`Ticket ${job.data.ticketId} marked as FAILED`);
    } catch (error) {
        console.error(`Failed to update ticket ${job.data.ticketId} to FAILED status:`, error);
    }
});

console.log("Ticket worker started...");