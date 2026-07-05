import type { NextFunction, Response } from "express";
import { verifyToken } from "../../security/token.js";
import { AppError } from "../errors.js";
import type { AuthedRequest } from "../types.js";

// Requires a valid `Authorization: Bearer <jwt>` header and attaches the
// decoded claims to req.auth. Synchronous throws are caught by Express 4.
export function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "missing bearer token");
  }
  try {
    req.auth = verifyToken(token);
  } catch {
    throw new AppError(401, "invalid or expired token");
  }
  next();
}
