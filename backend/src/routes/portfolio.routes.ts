import { Router } from "express";
import {
  addPosition,
  getPortfolio,
  deletePosition,
  addPositionSchema,
} from "../controllers/portfolio.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/positions", validateBody(addPositionSchema), addPosition);
router.get("/", getPortfolio);
router.delete("/positions/:id", deletePosition);

export default router;
