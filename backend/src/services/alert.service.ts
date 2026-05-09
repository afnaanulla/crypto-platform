import prisma from "../config/prisma";
import redis from "../config/redis";
import logger from "../utils/logger";
import { CoinPriceRecord } from "../types";

export const checkAndTriggerAlerts = async (
  prices: CoinPriceRecord[]
): Promise<void> => {
  const priceMap = new Map(prices.map((p) => [p.coinId, p.price]));

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

    if (!conditionMet) continue;

    toUpdate.push({ id: alert.id, currentPrice });

    // Publish to Redis — the backend's Socket.io subscriber (port 4000) picks
    // this up and emits to the correct user room. The worker runs on port 4001
    // with its own Socket.io that the frontend never connects to, so direct
    // io.emit from the worker would reach nobody.
    const payload = JSON.stringify({
      userId: alert.userId,
      alertId: alert.id,
      coinId: alert.coinId,
      condition: alert.condition,
      targetPrice: alert.targetPrice,
      currentPrice,
      triggeredAt: new Date().toISOString(),
    });

    await redis.publish("alert:triggered", payload).catch(() => {});

    logger.info(
      `Alert triggered — coinId: ${alert.coinId}, condition: ${alert.condition}, target: ${alert.targetPrice}, current: ${currentPrice}`
    );
  }

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
