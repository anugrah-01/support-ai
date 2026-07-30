import {z} from 'zod';

export const createTicketSchema = z.object({
    title: z
        .string()
        .min(5, "Title must be at least 5 characters.")
        .max(100, "Title cannot exceed 100 characters."),

    description: z
        .string()
        .min(10, "Description must be at least 10 characters.")
        .max(1000, "Description cannot exceed 1000 characters.")
});