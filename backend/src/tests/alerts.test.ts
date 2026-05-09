import { checkAndTriggerAlerts } from "../services/alert.service";
import { CoinPriceRecord } from "../types";
import prisma from "../config/prisma";

// Mock Prisma
jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: {
    alert: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock Redis — checkAndTriggerAlerts now publishes via Redis instead of io.emit
jest.mock("../config/redis", () => ({
  __esModule: true,
  default: {
    publish: jest.fn().mockResolvedValue(1),
    status: "ready",
  },
}));

import redis from "../config/redis";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

const makePrices = (overrides: Partial<CoinPriceRecord> = {}): CoinPriceRecord[] => [
  {
    coinId: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price: 46000,
    marketCap: 900_000_000_000,
    volume: 30_000_000_000,
    change24h: 2.5,
    ...overrides,
  },
];

describe("Alert service — checkAndTriggerAlerts", () => {
  beforeEach(() => jest.clearAllMocks());

  test("triggers alert when price crosses 'above' threshold", async () => {
    (mockPrisma.alert.findMany as jest.Mock).mockResolvedValue([
      {
        id: "alert-1",
        userId: "user-1",
        coinId: "bitcoin",
        condition: "above",
        targetPrice: 45000,
        isActive: true,
        isTriggered: false,
      },
    ]);
    (mockPrisma.alert.update as jest.Mock).mockResolvedValue({ count: 1 });

    await checkAndTriggerAlerts(makePrices({ price: 46000 }));

    expect(mockRedis.publish).toHaveBeenCalledWith(
      "alert:triggered",
      expect.stringContaining("alert-1")
    );
    expect(mockPrisma.alert.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "alert-1" } })
    );
  });

  test("triggers alert when price crosses 'below' threshold", async () => {
    (mockPrisma.alert.findMany as jest.Mock).mockResolvedValue([
      {
        id: "alert-2",
        userId: "user-2",
        coinId: "bitcoin",
        condition: "below",
        targetPrice: 47000,
        isActive: true,
        isTriggered: false,
      },
    ]);
    (mockPrisma.alert.update as jest.Mock).mockResolvedValue({ count: 1 });

    await checkAndTriggerAlerts(makePrices({ price: 46000 }));

    expect(mockRedis.publish).toHaveBeenCalledWith(
      "alert:triggered",
      expect.stringContaining("alert-2")
    );
  });

  test("does NOT trigger when price has not crossed threshold", async () => {
    (mockPrisma.alert.findMany as jest.Mock).mockResolvedValue([
      {
        id: "alert-3",
        userId: "user-3",
        coinId: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        isTriggered: false,
      },
    ]);

    await checkAndTriggerAlerts(makePrices({ price: 46000 }));

    expect(mockRedis.publish).not.toHaveBeenCalled();
    expect(mockPrisma.alert.update).not.toHaveBeenCalled();
  });

  test("skips when no active alerts", async () => {
    (mockPrisma.alert.findMany as jest.Mock).mockResolvedValue([]);

    await checkAndTriggerAlerts(makePrices());

    expect(mockRedis.publish).not.toHaveBeenCalled();
  });

  test("skips coins not in price data", async () => {
    (mockPrisma.alert.findMany as jest.Mock).mockResolvedValue([
      {
        id: "alert-4",
        userId: "user-4",
        coinId: "ethereum",
        condition: "above",
        targetPrice: 3000,
        isActive: true,
        isTriggered: false,
      },
    ]);

    // Only bitcoin in prices — ethereum missing
    await checkAndTriggerAlerts(makePrices());

    expect(mockRedis.publish).not.toHaveBeenCalled();
  });
});
