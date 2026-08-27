import prisma from "../config/prisma.js";
import { generateEmbedding } from "../ai/embedding.js";

const knowledge = [
    {
        title: "Payment Failed",
        content:
            "If a payment fails, the customer should wait a few minutes and check whether the amount was actually deducted. If the amount was deducted but the order was not created, the payment will be automatically refunded within 5-7 business days.",
        source: "Payment Support Guide",
    },

    {
        title: "Payment Successful but Order Missing",
        content:
            "If a customer's payment was successful but no order was created, the customer should not make another payment. Verify the transaction status first. Successful payments without an associated order are automatically refunded within 5-7 business days.",
        source: "Payment Support Guide",
    },

    {
        title: "Unable to Login",
        content:
            "If a customer cannot log in, they should use the password reset option. Password reset links are valid for 30 minutes. If the customer still cannot log in after resetting the password, they should clear their browser cache and request a new reset link.",
        source: "Account Support Guide",
    },

    {
        title: "Refund Processing",
        content:
            "Approved refunds are normally processed within 5-7 business days. The exact time for the amount to appear in the customer's account depends on the customer's bank or payment provider.",
        source: "Refund Policy",
    },

    {
        title: "Order Cancellation",
        content:
            "Customers can request cancellation before an order is shipped. Once an order has been shipped, cancellation is no longer guaranteed and the customer may need to initiate a return instead.",
        source: "Order Support Guide",
    },

    {
        title: "Password Reset",
        content:
            "Password reset links expire after 30 minutes. If the link has expired, the customer should request a new password reset email. Customers should never share their password or password reset link with anyone.",
        source: "Account Support Guide",
    },
];
async function seedKnowledge() {
    for(const item of knowledge) {
        const created = await prisma.knowledgeChunk.create({
            data: { 
                title: item.title,
                content: item.content,
                source: item.source 
            }
        });
        const embedding = await generateEmbedding(item.content);
        const vectorString = `[${embedding.join(",")}]`;

        await prisma.$executeRaw`
            UPDATE "KnowledgeChunk"
            SET "embedding" = ${vectorString}::vector
            WHERE "id" = ${created.id}
        `;
    }
    console.log("Knowledge seeding completed.");
}

seedKnowledge().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});