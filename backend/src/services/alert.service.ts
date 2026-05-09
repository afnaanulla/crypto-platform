import { Server as SocketIOServer } from "socket.io";
import prisma from "../config/prisma";
import logger from "../utils/logger";
import { CoinPriceRecord } from "../types";

export const checkAndTriggerAlerts = async (
  prices: CoinPriceRecord[],
  io: SocketIOServer
): Promise<void> => {
  const priceMap = new Map(prices.map((priceRecord) => [priceRecord.coinId, priceRecord.price]));

  const activeAlerts = await prisma.alert.findMany({
    where: { isActive: true, isTriggered: false },
  });

  if (activeAlerts.length === 0) return;

  const toUpdate: { id: string; currentPrice: number }[] = [];

  for (const alert of activeAlerts) {
    const currentPrice = priceMap.get(alert.coinId);
    if (currentPrice === undefined) continue;

    const conditionMet =
      (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
      (alert.condition === "below" && currentPrice <= alert.targetPrice);

    if (conditionMet) {
      toUpdate.push({ id: alert.id, currentPrice });

      // Notify the specific user via their socket room
      io.to(`user:${alert.userId}`).emit("alert:triggered", {
        alertId: alert.id,
        coinId: alert.coinId,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        currentPrice,
        triggeredAt: new Date().toISOString(),
      });

      logger.info(
        `Alert triggered — coinId: ${alert.coinId}, condition: ${alert.condition}, target: ${alert.targetPrice}, current: ${currentPrice}`
      );
    }
  }

  // Batch update all triggered alerts — mark as done and store the price
  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map(({ id, currentPrice }) =>
        prisma.alert.update({
          where: { id },
          data: {
            isTriggered: true,
            isActive: false,
            triggeredAt: new Date(),
            triggeredPrice: currentPrice,
          },
        })
      )
    );
  }
};
