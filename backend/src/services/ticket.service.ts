import { TicketPriority, TicketStatus } from "@prisma/client/wasm";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { Prisma } from "@prisma/client";

type UpdateTicketData = {
    title?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
};

export const createTicketService = async({title, description, userId, category, priority, summary, aiReply}: {title: string, description: string, userId: string, category: string, priority: TicketPriority, summary: string, aiReply: string}) => {
    const ticket = await prisma.ticket.create({
        data: {
            title,
            description,
            userId,
            category,
            priority,
            summary, 
            aiReply
        }
    })
    return ticket;
}

export const getTicketsService = async(userId: string, page: number, limit: number, status?: TicketStatus, priority?: TicketPriority, search?: string, sortBy?: string, order?: 'asc' | 'desc') => {
    const where = {
        userId,
        status: status ? { equals: status } : undefined,
        priority: priority ? { equals: priority } : undefined,
        OR: search ? [                                             //OR condition to search in title or description
            { title: { contains: search,
                mode : Prisma.QueryMode.insensitive                              //Case insensitive search, will match "ticket" and "Ticket"
             } 
            },
            { description: { contains: search,
                mode : Prisma.QueryMode.insensitive
             } 
            }
        ] : undefined
    };
    const orderBy = sortBy ? { [sortBy]: order || 'asc' } : undefined;  //Default order is ascending if not specified
    const totalCount = await prisma.ticket.count({
        where: where
    });

    const skip = (page - 1) * limit;
    const tickets = await prisma.ticket.findMany({
        where: where,
        skip,
        take: limit, 
        orderBy: orderBy
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    return {tickets, 
        pagination: {
        totalTickets: totalCount,
        totalPages,
        currentPage: page,
        limit
    }};
}

export const getTicketsByIdService = async(userId: string, ticketId: string) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId, 
            userId
        }
    });

    if (!ticket) {
        throw new AppError("Ticket not found", 404);
    }

    return ticket;
}

export const updateTicketService = async(userId: string, ticketId: string, data: UpdateTicketData, aiData?: {category: string, priority: TicketPriority, summary: string, aiReply: string}) => {
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
    return deletedTicket;
}