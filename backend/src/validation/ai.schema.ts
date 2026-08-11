import { z } from "zod";

export const aiTicketSchema = z.object({
    category: z.enum([
        "Billing",
        "Technical",
        "Account",
        "Shipping",
        "General"
    ]),

    priority: z.enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT"
    ]),

    summary: z.string().min(10),
    reply: z.string().min(20)
});