import type { NextFunction, Response } from "express";
import { AppError } from "../errors.js";
import type { Role } from "../../domain/user.js";
import type { AuthedRequest } from "../types.js";

// Restricts a route to the given roles. Must run after requireAuth.
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) throw new AppError(401, "authentication required");
    if (!roles.includes(req.auth.role)) {
      throw new AppError(403, "insufficient role");
    }
    next();
  };
}
