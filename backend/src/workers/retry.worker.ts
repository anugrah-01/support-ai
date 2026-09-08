import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";

const worker = new Worker(
    "retry-queue", async (job) => {
    console.log(`Processing job ${job.id}`);
    console.log("Attempt:", job.attemptsMade + 1);

    throw new Error("Something went wrong!");
    },
    {
        connection: redisConnection,
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("Retry worker started...");