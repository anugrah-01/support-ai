import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const retryQueue = new Queue("retry-queue", {
    connection: redisConnection,
});