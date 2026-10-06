import {Request, Response} from 'express';
import { createTicketService, getTicketsService , getTicketsByIdService, updateTicketService, deleteTicketService, regenerateReplyService, searchKnowledge, findTicketByIdempotencyKey} from '../services/ticket.service.js';
import { AIStatus, TicketStatus, TicketPriority } from '@prisma/client';
import { analyzeTicket, generateReplyFromAnalysis, generateSupportReply } from '../services/ai.service.js';
import { searchSimilarTickets } from '../services/ticket.service.js';

export const createTicket = async(req:Request, res:Response) => {
    try{
        const {title, description} = req.body;
        const userId = req.user?.id;

        const idempotencyKey = req.header("Idempotency-Key");

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }

        if (!idempotencyKey) {
            return res.status(400).json({
                success: false,
                message: "Idempotency-Key header is required",
            });
        }

        const existingTicket = await findTicketByIdempotencyKey( idempotencyKey, userId);

        if (existingTicket) {
            return res.status(200).json({
                success: true,
                data: existingTicket,
            });
        }

        const aiResult = await analyzeTicket(title, description);
        console.log("AI Result: ", aiResult);

        // const aiReply = await generateReply(aiResult.category, aiResult.priority, aiResult.summary);
        // console.log("aiReply:" +aiReply);

        const ticket = await createTicketService({
            title,
            description,
            userId,
            idempotencyKey,
            category: aiResult.category,
            priority: aiResult.priority,
            summary: aiResult.summary, 
        });
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

export const getTickets = async ( req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const pageValue = Number(req.query.page ?? 1);
        const limitValue = Number(req.query.limit ?? 10);

        const page =
            Number.isInteger(pageValue) && pageValue > 0
                ? pageValue
                : 1;

        const limit =
            Number.isInteger(limitValue) &&
            limitValue > 0 &&
            limitValue <= 50
                ? limitValue
                : 10;

        const aiStatusValue =
            typeof req.query.aiStatus === "string"
                ? req.query.aiStatus
                : undefined;

        const priorityValue =
            typeof req.query.priority === "string"
                ? req.query.priority
                : undefined;

        const statusValue =
            typeof req.query.status === "string"
                ? req.query.status
                : undefined;

        const category =
            typeof req.query.category === "string"
                ? req.query.category.trim()
                : undefined;

        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : undefined;

        const sortBy =
            typeof req.query.sortBy === "string"
                ? req.query.sortBy
                : "createdAt";

        const orderValue =
            typeof req.query.order === "string"
                ? req.query.order
                : "desc";

        if (orderValue !== "asc" && orderValue !== "desc") {
            return res.status(400).json({
                success: false,
                message: "Invalid order. Use asc or desc",
            });
        }

        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "priority",
            "status",
            "category",
            "title",
        ];

        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sortBy field",
            });
        }

        let aiStatus: AIStatus | undefined;

        if (aiStatusValue) {
            if (
                !Object.values(AIStatus).includes(
                    aiStatusValue as AIStatus
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid aiStatus. Use PENDING, PROCESSING, COMPLETED, or FAILED",
                });
            }

            aiStatus = aiStatusValue as AIStatus;
        }

        let priority: TicketPriority | undefined;

        if (priorityValue) {
            if (
                !Object.values(TicketPriority).includes(
                    priorityValue as TicketPriority
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority value",
                });
            }

            priority = priorityValue as TicketPriority;
        }

        let status: TicketStatus | undefined;

        if (statusValue) {
            if (
                !Object.values(TicketStatus).includes(
                    statusValue as TicketStatus
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid ticket status",
                });
            }

            status = statusValue as TicketStatus;
        }

        const result = await getTicketsService(
            userId,
            page,
            limit,
            aiStatus,
            priority,
            status,
            category,
            search,
            sortBy,
            orderValue
        );

        return res.status(200).json({
            success: true,
            data: result.tickets,
            pagination: result.pagination,
        });
    } catch (error: any) {
        console.error("Get tickets error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getTicketById = async(req:Request, res:Response) => {
    try {
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }
        const ticketId = req.params.id as string;
        const result = await getTicketsByIdService(userId, ticketId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }
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

        const aiResult = await analyzeTicket(req.body.title, req.body.description);

        const result = await updateTicketService(userId, ticketId, req.body, {
            category: aiResult.category,
            priority: aiResult.priority,
            summary: aiResult.summary,
        });
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

export const regenerateReply = async(req:Request, res:Response) => {
    try{
        const userId = req.user?.id;
        const ticketId = req.params.id as string;

        if(!userId || !ticketId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"     
            })
        }
        const result = await regenerateReplyService(userId, ticketId);
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch(error:any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export const searchTickets = async (req:Request, res:Response) => {
    try {
        const userId = req.user!.id;
        const query = req.query.query;

        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "invalid query"
            })
        }
        const result = await searchSimilarTickets(query, userId);
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


export const searchKnowledgeController = async (req: Request, res: Response) => {
    try {
        const query = req.query.query;

        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "invalid query"
            });
        }

        const result = await searchKnowledge(query);

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
};

export const generateSupportReplyController = async (req: Request, res: Response) => {
    try {
        const query = req.query.query;
        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "invalid query",
            });
        }
        const result = await generateSupportReply(query);
        return res.status(200).json({
            success: true,
            data: { result, },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}