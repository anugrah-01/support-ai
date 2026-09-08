import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const ticketQueue = new Queue("ticket-processing", {
    connection: redisConnection,
});