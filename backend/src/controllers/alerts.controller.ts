import { Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AuthRequest } from "../types";
import { COIN_IDS } from "../services/coingecko.service";
import logger from "../utils/logger";

export const createAlertSchema = z.object({
  coinId: z.string().refine((id) => COIN_IDS.includes(id), {
    message: "Unsupported coin ID",
  }),
  condition: z.enum(["above", "below"], {
    errorMap: () => ({ message: "Condition must be 'above' or 'below'" }),
  }),
  targetPrice: z.number().positive("Target price must be positive"),
});

export const createAlert = async (request: AuthRequest, response: Response): Promise<void> => {
  try {
    const { coinId, condition, targetPrice } = request.body as z.infer<
      typeof createAlertSchema
    >;

    // Guard: ensure user still exists in DB (token may be valid but user deleted / DB wiped)
    const userExists = await prisma.user.findUnique({ where: { id: request.userId! }, select: { id: true } });
    if (!userExists) {
      response.status(401).json({ success: false, message: "User account not found. Please log in again." });
      return;
    }

    const alert = await prisma.alert.create({
      data: {
        userId: request.userId!,
        coinId,
        condition,
        targetPrice,
        isActive: true,
      },
    });

    logger.info(`Alert created: ${alert.id} for user: ${request.userId}`);
    response.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error("createAlert error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to create alert" });
  }
};

export const getUserAlerts = async (request: AuthRequest, response: Response): Promise<void> => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: request.userId! },
      orderBy: { createdAt: "desc" },
    });
    response.json({ success: true, data: alerts });
  } catch (error) {
    logger.error("getUserAlerts error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to fetch alerts" });
  }
};

export const deleteAlert = async (request: AuthRequest, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const alert = await prisma.alert.findFirst({
      where: { id, userId: request.userId! },
    });

    if (!alert) {
      response.status(404).json({ success: false, message: "Alert not found" });
      return;
    }

    await prisma.alert.delete({ where: { id } });
    response.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    logger.error("deleteAlert error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to delete alert" });
  }
};
