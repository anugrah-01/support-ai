import {Request, Response} from 'express';
import { createTicketService } from '../services/ticket.service.js';
import { getTicketsService } from '../services/ticket.service.js';

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

        const tickets = await getTicketsService(userId);
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