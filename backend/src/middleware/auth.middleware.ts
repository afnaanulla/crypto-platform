import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";

export const authenticateToken = (
  request: AuthRequest,
  response: Response,
  next: NextFunction
): void => {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    response.status(401).json({ success: false, message: "Access token required" });
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    request.userId = payload.userId;
    next();
  } catch {
    response.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
