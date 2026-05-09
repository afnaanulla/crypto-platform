import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import pricesRoutes from "./routes/prices.routes";
import alertsRoutes from "./routes/alerts.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import adminRoutes from "./routes/admin.routes";
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { swaggerDocument } from "./config/swagger";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Apply general rate limiter to all API routes
app.use("/api", apiRateLimiter);

// Swagger UI — available at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Crypto Platform API Docs",
}));

// Base ping — no auth
app.get("/", (_: Request, response: Response) => {
  response.json({ success: true, message: "Crypto Platform API v1.0.0", docs: "/docs" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/prices", pricesRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);

// 404 fallthrough
app.use(notFoundHandler);

// Global error handler — must be last
app.use(globalErrorHandler);

export default app;