import { TicketPriority, TicketStatus } from "@prisma/client";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { Prisma, AIStatus } from "@prisma/client";
import { generateReplyFromAnalysis, generateSupportReply } from "./ai.service.js";
import { generateEmbedding } from "../ai/embedding.js";
import { ticketQueue } from "../queues/ticket.queue.js";
import { setCache, getCache, deleteCache, deleteTicketListCache } from "../utils/cache.js";

type UpdateTicketData = {
    title?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
};

type KnowledgeSearchResult = {
    id: string;
    title: string;
    content: string;
    source: string | null;
    similarity: number;
};

type GetTicketsParams = {
    userId: string;
    page: number;
    limit: number;
    aiStatus?: AIStatus;
    priority?: string;
    category?: string;
    status?: string;
};

export const createTicketService = async({title, description, userId, category, priority, summary, idempotencyKey}: {title: string, description: string, userId: string, category: string, priority: TicketPriority, summary: string, idempotencyKey: string}) => {
    const ticket = await prisma.ticket.create({
        data: {
            title,
            description,
            userId,
            category,
            priority,
            summary, 
            idempotencyKey,
        }
    })

    await deleteTicketListCache(userId);    // Invalidate the ticket list cache for the user after creating a new ticket

    await ticketQueue.add(
        "process-ticket", {
        ticketId: ticket.id,
        },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        }
    );

    /*const textToEmbed = `${title}\n${description}`;
    const embedding = await generateEmbedding(textToEmbed);
    console.log('embedding:' +embedding.length);

    const supportReply = await generateSupportReply(textToEmbed);

    const vectorString = `[${embedding.join(",")}]`;
    await prisma.$executeRaw `UPDATE "Ticket" SET "embedding" = ${vectorString}::vector WHERE "id" = ${ticket.id}`;
    const updatedTicket = await prisma.ticket.update({where: 
                            {id: ticket.id,},
                            data: {aiReply: supportReply,},
    });*/
    return ticket;
}

export const getTicketsService = async(userId: string, page: number, limit: number, aiStatus?: AIStatus, priority?: TicketPriority,status?: TicketStatus, category?: string, search?: string, sortBy: string = "createdAt", order: 'asc' | 'desc' = 'desc') => {
    const cacheKey = `tickets:${userId}:${page}:${limit}:${aiStatus || 'all'}:${priority || 'all'}:${status || 'all'}:${category || 'all'}:${search || 'all'}:${sortBy}:${order}`;
    const cachedTickets = await getCache<{tickets: any[], pagination: {totalTickets: number, totalPages: number, currentPage: number, limit: number}}>(cacheKey);

    if(cachedTickets) {
        console.log("Cache HIT:", cacheKey);
        return cachedTickets;
    }
    console.log("Cache MISS:", cacheKey);

    const where = {
        userId,
        aiStatus: aiStatus ? { equals: aiStatus } : undefined,
        priority: priority ? { equals: priority } : undefined,
        status: status? { equals: status }: undefined,
        category: category ? { equals: category }: undefined,
        OR: search ? [                                             //OR condition to search in title or description
            { title: { contains: search,
                mode : Prisma.QueryMode.insensitive                //Case insensitive search, will match "ticket" and "Ticket"
             } 
            },
            { description: { contains: search,
                mode : Prisma.QueryMode.insensitive
             } 
            }
        ] : undefined
    };
    const allowedSortFields = ["createdAt", "updatedAt", "priority", "status", "category", "title",] as const;
    type SortField = (typeof allowedSortFields)[number];

    const safeSortBy: SortField = allowedSortFields.includes(sortBy as SortField) ? (sortBy as SortField) : "createdAt";
    const orderBy: Prisma.TicketOrderByWithRelationInput = {[safeSortBy]: order,};     // Create an orderBy object with the safeSortBy field and order direction
    const skip = (page - 1) * limit;

    console.log("Counting tickets...");
    const [totalCount, tickets] = await prisma.$transaction([
        prisma.ticket.count({
            where,
        }),

        prisma.ticket.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                category: true,
                priority: true,
                summary: true,
                aiReply: true,
                aiStatus: true,
                aiError: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ]);

    
    const totalPages = Math.ceil(totalCount / limit);
    const result = {tickets, 
        pagination: {
            totalTickets: totalCount,
            totalPages,
            currentPage: page,
            limit,
        },
    };
    await setCache(cacheKey, result, 60);    // Cache the result for 60 seconds
    return result;
}

export const getTicketsByIdService = async(userId: string, ticketId: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId, 
            userId
        },
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            category: true,
            priority: true,
            summary: true,
            aiReply: true,
            aiStatus: true,
            aiError: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!ticket) {
        throw new AppError("Ticket not found", 404);
    }

    return ticket;
}

export const updateTicketService = async(userId: string, ticketId: string, data: UpdateTicketData, aiData?: {category: string, priority: TicketPriority, summary: string}) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId,
            userId
        }
    });

    if (!ticket) {
        throw new AppError("Ticket not found", 404);
    }

    const updatedTicket = await prisma.ticket.update({
        where: {
            id: ticketId
        },
        data: {
            ...data,
            ...aiData
        }
    });

    await deleteTicketListCache(userId);    // Invalidate the ticket list cache for the user after updating a ticket
    return updatedTicket;
}

export const deleteTicketService = async(userId: string, ticketId: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId,
            userId
        }
    });

    if (!ticket) {
        throw new AppError("Ticket not found", 404);
    }

    const deletedTicket = await prisma.ticket.delete({
        where: {
            id: ticketId
        }
    });

    await deleteTicketListCache(userId);    // Invalidate the ticket list cache for the user after deleting a ticket
    return deletedTicket;
}

export const regenerateReplyService = async(userId: string, ticketId: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId,
            userId
        } 
    });

    if(!ticket) {
        throw new AppError("Ticket not found", 404);
    }
    const regeneratedReply = await generateReplyFromAnalysis(ticket.category as string, ticket.priority, ticket.summary as string);
    const updatedTicket = await prisma.ticket.update({
        where: {
            id: ticketId
        },
        data: {
            aiReply: regeneratedReply
        }
    });
    return updatedTicket;
}

export const searchSimilarTickets = async (query: string, userId: string) => {
    const queryEmbedding = await generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(",")}]`;

    const tickets = await prisma.$queryRaw`
        SELECT 
            id,
            title,
            description,
            1 - ("embedding" <=> ${vectorString}::vector) AS similarity
        FROM "Ticket"
        WHERE "embedding" IS NOT NULL
          AND "userId" = ${userId}
          AND ("embedding" <=> ${vectorString}::vector) <= 0.30
        ORDER BY "embedding" <=> ${vectorString}::vector
        LIMIT 5;
    `;

    return tickets;
};

export const backfillTicketEmbeddings = async () => {
    const tickets = await prisma.$queryRaw<
        { id: string; title: string; description: string }[]
    >`
        SELECT id, title, description
        FROM "Ticket"
        WHERE "embedding" IS NULL
    `;

    console.log(`Tickets needing embeddings: ${tickets.length}`);

    for(const ticket of tickets) {
        const textToEmbed = `${ticket.title}\n${ticket.description}`
        const embedding = await generateEmbedding(textToEmbed);

        const vectorString = `[${embedding.join(",")}]`;
        await prisma.$executeRaw 
            `UPDATE "Ticket" SET 
            "embedding" = ${vectorString}::vector 
            WHERE "id" = ${ticket.id}`; 
        
        console.log(`Embedded ticket: ${ticket.id}`);
        
    }
}

export const searchKnowledge = async (query: string) => {
    const queryEmbedding = await generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(",")}]`;

    const chunks = await prisma.$queryRaw<KnowledgeSearchResult[]>`
        SELECT 
            id,
            title,
            content,
            source,
            1 - ("embedding" <=> ${vectorString}::vector) AS similarity
        FROM "KnowledgeChunk"
        WHERE "embedding" IS NOT NULL
          AND ("embedding" <=> ${vectorString}::vector) <= 0.40
        ORDER BY "embedding" <=> ${vectorString}::vector
        LIMIT 3;
    `;
    return chunks;
}

export const findTicketByIdempotencyKey = async (idempotencyKey: string, userId: string) => {
  return prisma.ticket.findFirst({
    where: {
      idempotencyKey,
      userId,
    },
  });
};