import "dotenv/config";
import { Redis } from "ioredis";

export const redisConnection = {
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
};

export const redisClient = new Redis({
    host: redisConnection.host,
    port: redisConnection.port,
});