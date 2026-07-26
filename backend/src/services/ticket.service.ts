import prisma from "../config/prisma.js";

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

export const getTicketsService = async(userId: string) => {
    const tickets = await prisma.ticket.findMany({
        where: {
            userId
        }
    })
    return tickets;
}