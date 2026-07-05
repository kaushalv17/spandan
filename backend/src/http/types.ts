import type { Request } from "express";
import type { TokenClaims } from "../security/token.js";

export interface AuthedRequest extends Request {
  auth?: TokenClaims;
}
