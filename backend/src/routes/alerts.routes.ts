import { Router } from "express";
import {
  createAlert,
  getUserAlerts,
  deleteAlert,
  createAlertSchema,
} from "../controllers/alerts.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/", validateBody(createAlertSchema), createAlert);
router.get("/", getUserAlerts);
router.delete("/:id", deleteAlert);

export default router;
