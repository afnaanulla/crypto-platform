import request from "supertest";
import app from "../app";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";

describe("Auth Endpoints", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Register now returns same shape as login: { token, user: { id, email } }
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user).toHaveProperty("id");
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "not-an-email", password: testPassword });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("should reject short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "other@example.com", password: "short" });

      expect(res.status).toBe(400);
    });

    it("should reject missing body fields", async () => {
      const res = await request(app).post("/api/auth/register").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it("should reject wrong password with generic message", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "WrongPassword!" });

      expect(res.status).toBe(401);
      // Must NOT reveal whether email or password was wrong (anti-enumeration)
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should reject non-existent email with same message", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "ghost@example.com", password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });
  });
});
