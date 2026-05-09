import { Request, Response } from "express";
import prisma from "../config/prisma";
import redis from "../config/redis";
import logger from "../utils/logger";

export const getHealthStatus = async (
  _request: Request,
  response: Response
): Promise<void> => {
  const startTime = Date.now();

  const [dbStatus, redisStatus] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`.then(() => "healthy"),
    redis.ping().then(() => "healthy"),
  ]);

  const health = {
    status: "operational",
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startTime,
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database:
        dbStatus.status === "fulfilled" ? dbStatus.value : "unhealthy",
      redis:
        redisStatus.status === "fulfilled" ? redisStatus.value : "unavailable",
      worker: "running",
    },
    memory: {
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  const httpStatus =
    health.services.database === "unhealthy" ? 503 : 200;

  logger.info("Health check requested", { status: health.status });
  response.status(httpStatus).json({ success: true, data: health });
};
