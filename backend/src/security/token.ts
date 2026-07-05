import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role, UUID } from "../domain/user.js";

export interface TokenClaims {
  sub: UUID;
  email: string;
  role: Role;
}

export function signToken(claims: TokenClaims): string {
  const options = { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions;
  return jwt.sign(claims, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("invalid token payload");
  }
  const { sub, email, role } = decoded as jwt.JwtPayload & Partial<TokenClaims>;
  if (!sub || !email || !role) {
    throw new Error("token is missing required claims");
  }
  return { sub, email, role };
}
