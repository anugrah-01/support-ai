import { TicketPriority, TicketStatus } from "@prisma/client/wasm";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

type UpdateTicketData = {
    title?: string;
    description?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
};

export const createTicketService = async({title, description, userId}: {title: string, description: string, userId: string}) => {
    const ticket = await prisma.ticket.create({
        data: {
            title,
            description,
            userId
        }
    })
    return ticket;
}

export const getTicketsService = async(userId: string, page: number, limit: number) => {
    const totalCount = await prisma.ticket.count({
        where: {
            userId
        }
    });

    const skip = (page - 1) * limit;
    const tickets = await prisma.ticket.findMany({
        where: {
            userId
        }, 
        skip,
        take: limit
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

export const updateTicketService = async(userId: string, ticketId: string, data: UpdateTicketData) => {
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
        data
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