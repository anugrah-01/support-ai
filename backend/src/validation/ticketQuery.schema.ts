import { z } from "zod";

export const ticketQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),               //coerce meaning convert the value to a number if it's a string, default meaning if the value is not provided, it will default to 1

    limit: z.coerce.number().min(1).max(100).default(10),

    search: z.string().optional(),

    status: z
        .enum([
            "OPEN",
            "IN_PROGRESS",
            "RESOLVED",
            "CLOSED"
        ])
        .optional(),

    priority: z
        .enum([
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
        ])
        .optional(),

    sortBy: z
        .enum([
            "title",
            "createdAt",
            "updatedAt",
            "status",
            "priority"
        ])
        .optional(),

    order: z.enum(["asc", "desc"]).optional()
});