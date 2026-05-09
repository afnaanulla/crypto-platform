import { Router } from "express";
import {
  getLivePricesHandler,
  getPriceHistoryHandler,
  getVolatilityHandler,
  getCorrelationHandler,
} from "../controllers/prices.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/live", getLivePricesHandler);
router.get("/history/:coinId", getPriceHistoryHandler);
router.get("/analytics/volatility", getVolatilityHandler);
router.get("/analytics/correlations", getCorrelationHandler);

export default router;
