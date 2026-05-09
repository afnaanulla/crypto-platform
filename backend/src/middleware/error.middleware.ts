import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const globalErrorHandler = (
  error: Error,
  request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error("Unhandled error", {
    message: error.message,
    stack: error.stack,
    path: request.path,
    method: request.method,
  });

  response.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
};

export const notFoundHandler = (request: Request, response: Response): void => {
  response.status(404).json({
    success: false,
    message: `Route ${request.method} ${request.path} not found`,
  });
};
