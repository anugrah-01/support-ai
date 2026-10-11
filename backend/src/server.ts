import app from "./app.js";
import dotenv from "dotenv";
import prisma from "./config/prisma.js";
import { redisClient } from "./config/redis.js";
import { ticketQueue } from "./queues/ticket.queue.js";
import { worker } from "./workers/ticket.worker.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 30_000);

  shutdownTimeout.unref();

  try {
    // Stop accepting new HTTP requests and wait for active requests.
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    console.log("HTTP server closed.");

    // Stop taking new jobs and wait for active jobs to finish.
    await worker.close();
    console.log("Ticket worker closed.");

    await ticketQueue.close();
    console.log("Ticket queue closed.");

    await prisma.$disconnect();
    console.log("Prisma disconnected.");

    await redisClient.quit();
    console.log("Redis connection closed.");

    clearTimeout(shutdownTimeout);
    console.log("Graceful shutdown completed.");
    process.exitCode = 0;
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    clearTimeout(shutdownTimeout);
    process.exitCode = 1;
  }
};

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
