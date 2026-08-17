import { backfillTicketEmbeddings } from "../services/ticket.service.js";

backfillTicketEmbeddings()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });