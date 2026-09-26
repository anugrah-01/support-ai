import { Request, Response, NextFunction } from 'express';

const requestStore = new Map<string, {count : number, windowStart: number}>();   // Store for tracking requests per IP address

const WINDOW_SIZE = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 5; // Maximum requests allowed per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip;
    const record = requestStore.get(clientIp as string);
    const currentTime = Date.now();

    if(!record) {
        requestStore.set(clientIp as string, {count: 1, windowStart: currentTime});
        return next();    //rate limiter has approved the request, so we call next() to pass control to the next middleware or route handler
    }

    const timeElapsed = currentTime - record.windowStart;

    if(timeElapsed > WINDOW_SIZE) {
        // Reset the count and window start time
        requestStore.set(clientIp as string, {count: 1, windowStart: currentTime});
        return next();
    }

    if(record.count >= MAX_REQUESTS) {
        return res.status(429).json({ 
            success: false,
            message: 'Too many requests. Please try again later.' });
    }

    record.count++;
    return next();
}