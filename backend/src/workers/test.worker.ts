import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";

const worker = new Worker("test-queue", async (job) => {
        console.log("Processing job:", job.id);
        console.log("Job data:", job.data);

        console.log("Hello from worker!");
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

console.log("Worker started...");