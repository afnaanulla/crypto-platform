import { Response } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { AuthRequest } from "../types";
import { getLivePrices, COIN_IDS, COIN_META } from "../services/coingecko.service";
import logger from "../utils/logger";

export const addPositionSchema = z.object({
  coinId: z.string().refine((id) => COIN_IDS.includes(id), {
    message: "Unsupported coin ID",
  }),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
});

export const addPosition = async (request: AuthRequest, response: Response): Promise<void> => {
  try {
    const { coinId, quantity, purchasePrice } = request.body as z.infer<
      typeof addPositionSchema
    >;

    // Guard: ensure user still exists in DB (token may be valid but user deleted / DB wiped)
    const userExists = await prisma.user.findUnique({ where: { id: request.userId! }, select: { id: true } });
    if (!userExists) {
      response.status(401).json({ success: false, message: "User account not found. Please log in again." });
      return;
    }

    const position = await prisma.portfolio.create({
      data: {
        userId: request.userId!,
        coinId,
        symbol: COIN_META[coinId]?.symbol ?? coinId.toUpperCase(),
        name: COIN_META[coinId]?.name ?? coinId,
        quantity,
        purchasePrice,
      },
    });

    logger.info(`Position added: ${position.id} for user: ${request.userId}`);
    response.status(201).json({ success: true, data: position });
  } catch (error) {
    logger.error("addPosition error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to add position" });
  }
};

export const getPortfolio = async (request: AuthRequest, response: Response): Promise<void> => {
  try {
    const [positions, livePrices] = await Promise.all([
      prisma.portfolio.findMany({
        where: { userId: request.userId! },
        orderBy: { createdAt: "desc" },
      }),
      getLivePrices(),
    ]);

    const priceMap = new Map(livePrices.map((coin) => [coin.coinId, coin.price]));

    const positionsWithPnL = positions.map((position) => {
      const currentPrice = priceMap.get(position.coinId) ?? 0;
      const currentValue = position.quantity * currentPrice;
      const costBasis = position.quantity * position.purchasePrice;
      const pnl = currentValue - costBasis;
      const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        ...position,
        currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        costBasis: parseFloat(costBasis.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnlPercentage: parseFloat(pnlPercentage.toFixed(2)),
      };
    });

    const totalValue = positionsWithPnL.reduce((sum, position) => sum + position.currentValue, 0);
    const totalCost = positionsWithPnL.reduce((sum, position) => sum + position.costBasis, 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    response.json({
      success: true,
      data: {
        positions: positionsWithPnL,
        summary: {
          totalValue: parseFloat(totalValue.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          totalPnL: parseFloat(totalPnL.toFixed(2)),
          totalPnLPercentage: parseFloat(totalPnLPercentage.toFixed(2)),
        },
      },
    });
  } catch (error) {
    logger.error("getPortfolio error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to fetch portfolio" });
  }
};

export const deletePosition = async (request: AuthRequest, response: Response): Promise<void> => {
  try {
    const { id } = request.params;

    const position = await prisma.portfolio.findFirst({
      where: { id, userId: request.userId! },
    });

    if (!position) {
      response.status(404).json({ success: false, message: "Position not found" });
      return;
    }

    await prisma.portfolio.delete({ where: { id } });
    response.json({ success: true, message: "Position removed" });
  } catch (error) {
    logger.error("deletePosition error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to delete position" });
  }
};
