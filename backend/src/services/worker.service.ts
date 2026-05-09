import cron from "node-cron";
import { fetchAndCachePrices } from "./coingecko.service";
import { checkAndTriggerAlerts } from "./alert.service";
import redis from "../config/redis";
import logger from "../utils/logger";

let isRunning = false;

export const runPriceCycle = async (): Promise<void> => {
  if (isRunning) {
    logger.warn("Previous price cycle still running — skipping this tick");
    return;
  }

  isRunning = true;

  try {
    const prices = await fetchAndCachePrices();
    logger.info(`Worker cycle: Fetched ${prices.length} prices. Broadcasting...`);

    // Publish prices to Redis — backend's subClient forwards to WebSocket clients
    const published = await redis.publish("prices:update", JSON.stringify({
      prices,
      timestamp: new Date().toISOString(),
    })).catch(() => 0);



    // Check and fire any triggered alerts (publishes via Redis)
    await checkAndTriggerAlerts(prices);


    logger.info(`Price cycle complete — broadcasted ${prices.length} coins`);
  } catch (error) {
    logger.error("Price worker cycle failed", {
      message: (error as Error).message,
    });
  } finally {
    isRunning = false;
  }
};

export const startPriceWorker = (): void => {
  logger.info("Starting background price worker — interval: 10s");

  // Run once immediately on startup
  runPriceCycle();

  // Every 10s = 6 calls/min — safe within CoinGecko free tier (30 calls/min)
  cron.schedule("*/10 * * * * *", runPriceCycle);
};
