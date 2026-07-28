import {Request, Response} from 'express';
import { createTicketService, getTicketsService , getTicketsByIdService, updateTicketService, deleteTicketService} from '../services/ticket.service.js';

export const createTicket = async(req:Request, res:Response) => {
    try{
        const {title, description} = req.body;
        const userId = req.user?.id;

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }

        const ticket = await createTicketService({title, description, userId});
        return res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (error : any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
    
}

export const getTickets = async(req:Request, res:Response) => {
    try {
        const userId = req.user?.id;

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const tickets = await getTicketsService(userId, page, limit);

        return res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export const getTicketById = async(req:Request, res:Response) => {
    try{
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }
        const ticketId = req.params.id as string;
        const result = await getTicketsByIdService(userId, ticketId);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export const updateTicket = async(req:Request, res:Response) => {
    try {
        const userId = req.user?.id;
        const ticketId = req.params.id as string;

        if(!userId || !ticketId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }

        const result = await updateTicketService(userId, ticketId, req.body);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error:any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export const deleteTicket = async(req:Request, res:Response) => {
    try {
        const userId = req.user?.id;
        const ticketId = req.params.id as string;

        if(!userId || !ticketId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }

        const result = await deleteTicketService(userId, ticketId);
        return res.status(200).json({
            success: true,
            "message": "Ticket deleted successfully"
        });
    } catch(error:any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}