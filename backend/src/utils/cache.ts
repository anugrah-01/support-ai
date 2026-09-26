import { redisClient } from "../config/redis.js";

export const getCache = async <T>(key: string): Promise<T | null> => {
    const data = await redisClient.get(key);    // Retrieve the cached data from Redis using the provided key
    if(!data) {
        return null;                // If no data is found for the given key, return null
    }
    return JSON.parse(data) as T;    // Parse the cached data from JSON string to the expected type T and return it
}

export const setCache = async <T>(key: string, data: T, ttl: number): Promise<void> => {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttl);    // Store the data in Redis as a JSON string with the specified time-to-live (ttl) in seconds
}

export const deleteCache = async (key: string): Promise<void> => {
    await redisClient.del(key);    // Delete the cached data from Redis for the provided key
}

export const deleteTicketListCache = async (userId: string): Promise<void> => {
    const keys = await redisClient.keys(`tickets:${userId}:*`);    // Retrieve all keys that match the pattern for the user's ticket list cache
    if(keys.length > 0) {
        await redisClient.del(keys);    // If any keys are found, delete them from Redis
    }
}