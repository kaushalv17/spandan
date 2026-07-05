import type { NextFunction, Request, Response } from "express";
import { type ZodTypeAny } from "zod";
import { AppError } from "../errors.js";

// Validates and replaces req.body with the parsed, typed payload.
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "validation failed", parsed.error.flatten());
    }
    req.body = parsed.data;
    next();
  };
}
