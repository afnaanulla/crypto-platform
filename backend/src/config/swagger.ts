export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Crypto Market Intelligence API",
    version: "1.0.0",
    description:
      "Real-time cryptocurrency market data, alerts, and portfolio tracking platform.",
  },
  servers: [{ url: "/api", description: "API base" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      CoinPrice: {
        type: "object",
        properties: {
          coinId: { type: "string", example: "bitcoin" },
          symbol: { type: "string", example: "BTC" },
          name: { type: "string", example: "Bitcoin" },
          price: { type: "number", example: 65000 },
          marketCap: { type: "number", nullable: true },
          volume: { type: "number", nullable: true },
          change24h: { type: "number", nullable: true },
        },
      },
      Alert: {
        type: "object",
        properties: {
          id: { type: "string" },
          coinId: { type: "string" },
          condition: { type: "string", enum: ["above", "below"] },
          targetPrice: { type: "number" },
          isActive: { type: "boolean" },
          isTriggered: { type: "boolean" },
          triggeredAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Portfolio: {
        type: "object",
        properties: {
          id: { type: "string" },
          coinId: { type: "string" },
          symbol: { type: "string" },
          name: { type: "string" },
          quantity: { type: "number" },
          purchasePrice: { type: "number" },
          currentPrice: { type: "number" },
          currentValue: { type: "number" },
          pnl: { type: "number" },
          pnlPercentage: { type: "number" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created" },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Login and receive JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful, returns token" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/prices/live": {
      get: {
        tags: ["Prices"],
        summary: "Get live prices for all tracked coins",
        responses: {
          "200": {
            description: "Live price data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/CoinPrice" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/prices/history/{coinId}": {
      get: {
        tags: ["Prices"],
        summary: "Get price history for a coin",
        parameters: [
          { name: "coinId", in: "path", required: true, schema: { type: "string" } },
          { name: "days", in: "query", schema: { type: "integer", default: 7, minimum: 1, maximum: 30 } },
        ],
        responses: { "200": { description: "Price history with stats" } },
      },
    },
    "/prices/analytics/volatility": {
      get: {
        tags: ["Analytics"],
        summary: "Volatility ranking for all coins (7-day)",
        responses: { "200": { description: "Volatility data sorted descending" } },
      },
    },
    "/prices/analytics/correlations": {
      get: {
        tags: ["Analytics"],
        summary: "Correlation matrix between all coins (7-day)",
        responses: { "200": { description: "NxN correlation matrix" } },
      },
    },
    "/alerts": {
      get: {
        tags: ["Alerts"],
        summary: "List all alerts for authenticated user",
        responses: { "200": { description: "List of alerts" } },
      },
      post: {
        tags: ["Alerts"],
        summary: "Create a price alert",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["coinId", "condition", "targetPrice"],
                properties: {
                  coinId: { type: "string", example: "bitcoin" },
                  condition: { type: "string", enum: ["above", "below"] },
                  targetPrice: { type: "number", example: 70000 },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Alert created" }, "400": { description: "Validation error" } },
      },
    },
    "/alerts/{id}": {
      delete: {
        tags: ["Alerts"],
        summary: "Delete an alert",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Alert deleted" }, "404": { description: "Not found" } },
      },
    },
    "/portfolio": {
      get: {
        tags: ["Portfolio"],
        summary: "Get portfolio with live P&L calculation",
        responses: { "200": { description: "Portfolio positions and summary" } },
      },
    },
    "/portfolio/positions": {
      post: {
        tags: ["Portfolio"],
        summary: "Add a portfolio position",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["coinId", "quantity", "purchasePrice"],
                properties: {
                  coinId: { type: "string" },
                  quantity: { type: "number" },
                  purchasePrice: { type: "number" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Position added" } },
      },
    },
    "/portfolio/positions/{id}": {
      delete: {
        tags: ["Portfolio"],
        summary: "Remove a portfolio position",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Position removed" } },
      },
    },
    "/admin/health": {
      get: {
        tags: ["Admin"],
        security: [],
        summary: "System health check",
        responses: { "200": { description: "All services healthy" }, "503": { description: "DB unhealthy" } },
      },
    },
  },
};
