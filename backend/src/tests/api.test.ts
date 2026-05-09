import request from "supertest";
import app from "../app";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

let authToken: string;
let userId: string;

const testEmail = `portfolio-${Date.now()}@example.com`;

beforeAll(async () => {
  const hashed = await bcrypt.hash("TestPass123!", 12);
  const user = await prisma.user.create({
    data: { email: testEmail, password: hashed },
  });
  userId = user.id;
  authToken = jwt.sign({ userId }, process.env.JWT_SECRET || "test-secret", {
    expiresIn: "1h",
  });
});

afterAll(async () => {
  await prisma.portfolio.deleteMany({ where: { userId } });
  await prisma.alert.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("Alerts API", () => {
  let createdAlertId: string;

  it("POST /api/alerts — should create an alert", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ coinId: "bitcoin", condition: "above", targetPrice: 60000 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdAlertId = res.body.data.id;
  });

  it("GET /api/alerts — should list user alerts", async () => {
    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("POST /api/alerts — should reject unsupported coin", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ coinId: "fakecoin", condition: "above", targetPrice: 100 });

    expect(res.status).toBe(400);
  });

  it("DELETE /api/alerts/:id — should delete alert", async () => {
    const res = await request(app)
      .delete(`/api/alerts/${createdAlertId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/alerts");
    expect(res.status).toBe(401);
  });
});

describe("Portfolio API", () => {
  let positionId: string;

  it("POST /api/portfolio/positions — should add position", async () => {
    const res = await request(app)
      .post("/api/portfolio/positions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ coinId: "ethereum", quantity: 2, purchasePrice: 2000 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    positionId = res.body.data.id;
  });

  it("GET /api/portfolio — should return portfolio with P&L", async () => {
    const res = await request(app)
      .get("/api/portfolio")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.positions).toBeDefined();
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary).toHaveProperty("totalValue");
    expect(res.body.data.summary).toHaveProperty("totalPnL");
  });

  it("DELETE /api/portfolio/positions/:id — should remove position", async () => {
    const res = await request(app)
      .delete(`/api/portfolio/positions/${positionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });
});

describe("Admin Health", () => {
  it("GET /api/admin/health — should return health status", async () => {
    const res = await request(app).get("/api/admin/health");
    expect(res.status).toBe(200);
    expect(res.body.data.services).toBeDefined();
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });
});
