import Redis from "ioredis";
import logger from "../utils/logger";

const redisUrl = process.env.REDIS_URL;

let redis: Redis;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  });

  redis.on("connect", () => logger.info("Redis connected"));
  redis.on("ready", () => logger.info("Redis ready"));
  redis.on("error", (error) => logger.error("Redis error", { message: error.message }));
  redis.on("close", () => logger.warn("Redis connection closed"));
} else {
  logger.warn("REDIS_URL not set — Redis disabled, using in-memory fallback");
  redis = new Redis({ lazyConnect: true, enableOfflineQueue: false });
  redis.disconnect();
}

export const safeGet = async (key: string): Promise<string | null> => {
  try {
    if (redis.status === "end") return null; 
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const safeSet = async (
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> => {
  try {
    if (redis.status === "end") return;
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
  }
};

export const subClient = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: null })
  : null;

if (subClient) {
  subClient.on("error", (error) => 
    logger.error("Redis Sub error", { message: error.message })
  );
}

export default redis;