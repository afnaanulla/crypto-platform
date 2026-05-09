import { Router } from "express";
import { getHealthStatus } from "../controllers/admin.controller";

const router = Router();

// Public — monitoring tools must reach this without auth
router.get("/health", getHealthStatus);

export default router;
