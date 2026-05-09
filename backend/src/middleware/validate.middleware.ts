import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody =
  (schema: ZodSchema) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));
      response.status(400).json({ success: false, message: "Validation failed", errors });
      return;
    }
    request.body = result.data;
    next();
  };

export const validateQuery =
  (schema: ZodSchema) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));
      response.status(400).json({ success: false, message: "Invalid query params", errors });
      return;
    }
    request.query = result.data as Record<string, string>;
    next();
  };
