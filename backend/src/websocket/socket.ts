import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";
import { subClient } from "../config/redis";
import logger from "../utils/logger";

let io: SocketIOServer;

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Authenticate socket to join personal room for alert notifications
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as JwtPayload;
        socket.join(`user:${payload.userId}`);
        logger.info(`Socket ${socket.id} joined room user:${payload.userId}`);
      } catch {
        logger.warn(`Socket ${socket.id} provided invalid auth token`);
      }
    }

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  logger.info("Socket.io initialized");

  // If Redis subClient is available, listen for price updates from the worker process
  if (subClient) {
    subClient.subscribe("prices:update", "alert:triggered", (error) => {
      if (error) logger.error("Failed to subscribe to Redis channels", { message: error.message });
      else logger.info("Subscribed to Redis channels: prices:update, alert:triggered");
    });

    subClient.on("message", (channel, message) => {
      if (channel === "prices:update") {
        try {
          const data = JSON.parse(message);
          io.emit("prices:update", data);
        } catch (error) {
          logger.error("Failed to parse Redis price update", { message: (error as Error).message });
        }
      }

      if (channel === "alert:triggered") {
        try {
          const data = JSON.parse(message);
          // Emit only to the specific user's room
          io.to(`user:${data.userId}`).emit("alert:triggered", {
            alertId: data.alertId,
            coinId: data.coinId,
            condition: data.condition,
            targetPrice: data.targetPrice,
            currentPrice: data.currentPrice,
            triggeredAt: data.triggeredAt,
          });
          logger.info(`Alert:triggered forwarded to user:${data.userId} for ${data.coinId}`);
        } catch (error) {
          logger.error("Failed to parse Redis alert:triggered", { message: (error as Error).message });
        }
      }
    });
  }

  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};
