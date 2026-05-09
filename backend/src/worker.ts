import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { startPriceWorker } from "./services/worker.service";
import { initializeSocket } from "./websocket/socket";
import logger from "./utils/logger";
import prisma from "./config/prisma";

const PORT = Number(process.env.WORKER_PORT) || 4001;
const server = http.createServer();

// Initialize Socket.io (needed for alert triggering and local broadcast)
initializeSocket(server);

// Start the worker loop logic
startPriceWorker();

server.listen(PORT, () => {
  logger.info(`Price Worker listening for connections on port ${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info("Worker process shutting down...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
