import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { initializeSocket } from "./websocket/socket";
import { startPriceWorker } from "./services/worker.service";
import logger from "./utils/logger";
import prisma from "./config/prisma";

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

// Initialize Socket.io (must happen before worker starts)
initializeSocket(server);

// Start background price worker
// In development, we run it in-process for convenience.
// In production, we typically run it as a separate process (see worker.ts).
if (process.env.RUN_WORKER_IN_PROCESS !== "false") {
  startPriceWorker();
}

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal} — shutting down gracefully`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { message: (error as Error).message });
      process.exit(1);
    }
  });

  // Force shutdown after 15s
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 15_000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
  process.exit(1);
});