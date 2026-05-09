import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/prisma";
import logger from "../utils/logger";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const register = async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password } = request.body as z.infer<typeof registerSchema>;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      response.status(409).json({ success: false, message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    logger.info(`New user registered: ${user.id}`);

    response.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { token, user: { id: user.id, email: user.email } },
    });
  } catch (error) {
    logger.error("Register error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password } = request.body as z.infer<typeof loginSchema>;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always compare to prevent timing attacks / user enumeration
    const dummyHash = "$2b$12$invalidhashfortimingatk";
    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isMatch) {
      response.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    logger.info(`User logged in: ${user.id}`);

    response.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: { id: user.id, email: user.email },
      },
    });
  } catch (error) {
    logger.error("Login error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Internal server error" });
  }
};