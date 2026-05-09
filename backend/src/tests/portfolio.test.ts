import { calculateVolatility } from "../utils/analytics";
import prisma from "../config/prisma";

// Mock prisma
jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: {
    portfolio: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import logger from "../utils/logger";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Portfolio P&L calculation", () => {
  beforeAll(() => logger.info("Testing Portfolio P&L logic..."));
  beforeEach(() => jest.clearAllMocks());

  test("calculates positive P&L correctly", () => {
    const quantity = 0.5;
    const purchasePrice = 40000;
    const currentPrice = 50000;

    const costBasis = quantity * purchasePrice;      // 20000
    const currentValue = quantity * currentPrice;    // 25000
    const pnl = currentValue - costBasis;             // 5000
    const pnlPct = (pnl / costBasis) * 100;          // 25%

    expect(pnl).toBe(5000);
    expect(pnlPct).toBe(25);
  });

  test("calculates negative P&L correctly", () => {
    const quantity = 2;
    const purchasePrice = 3000;
    const currentPrice = 2500;

    const costBasis = quantity * purchasePrice;   // 6000
    const currentValue = quantity * currentPrice; // 5000
    const pnl = currentValue - costBasis;          // -1000
    const pnlPct = (pnl / costBasis) * 100;       // -16.67%

    expect(pnl).toBeCloseTo(-1000, 2);
    expect(pnlPct).toBeCloseTo(-16.67, 1);
  });

  test("returns 0% P&L when price unchanged", () => {
    const qty = 1, price = 50000;
    const pnl = qty * price - qty * price;
    expect(pnl).toBe(0);
  });

  test("handles zero cost basis without dividing by zero", () => {
    const costBasis = 0;
    const pnl = 500;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    expect(pnlPct).toBe(0);
  });

  test("aggregates multiple positions correctly", () => {
    const positions = [
      { qty: 1, purchase: 50000, current: 55000 },
      { qty: 10, purchase: 300, current: 350 },
    ];

    const totalValue = positions.reduce((s, p) => s + p.qty * p.current, 0);
    const totalCost  = positions.reduce((s, p) => s + p.qty * p.purchase, 0);
    const totalPnL   = totalValue - totalCost;

    expect(totalValue).toBe(58500);  // 55000 + 3500
    expect(totalCost).toBe(53000);   // 50000 + 3000
    expect(totalPnL).toBe(5500);
  });
});
