import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors.js";
import { logger } from "../../infrastructure/logger.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "not found" });
}

// Express requires the 4-arg signature to recognise this as an error handler.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({ error: "validation failed", details: err.flatten() });
    return;
  }
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "internal server error" });
}
