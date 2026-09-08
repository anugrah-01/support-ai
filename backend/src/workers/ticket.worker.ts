import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { generateEmbedding } from "../ai/embedding.js";
import { generateSupportReply } from "../services/ai.service.js";
import prisma from "../config/prisma.js";

const worker = new Worker( "ticket-processing", 
    async (job) => {
        console.log("Processing job:", job.id);
        const { ticketId } = job.data;
        console.log(`Ticket ID: ${ticketId}`);

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if(!ticket) {
            throw new Error(`Ticket with ID ${ticketId} not found`);
        }

        const textToEmbed = `${ticket.title}\n${ticket.description}`;
        const embedding = await generateEmbedding(textToEmbed);
        console.log('embedding:' +embedding.length);

        const vectorString = `[${embedding.join(",")}]`;
        await prisma.$executeRaw `UPDATE "Ticket" SET "embedding" = ${vectorString}::vector WHERE "id" = ${ticket.id}`;

        const supportReply = await generateSupportReply(textToEmbed);
        const updatedTicket = await prisma.ticket.update({where: 
                                {id: ticket.id,},
                                data: {aiReply: supportReply,},
        });
        console.log(`Ticket ${ticketId} processed successfully`);
    },
    {
        connection: redisConnection,
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("Ticket worker started...");