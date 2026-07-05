import { hashPassword, verifyPassword } from "../security/password.js";
import { signToken } from "../security/token.js";
import * as users from "../repositories/userRepository.js";
import { writeAudit } from "../repositories/auditRepository.js";
import { AppError } from "../http/errors.js";
import type { User } from "../domain/user.js";

export interface AuthResult {
  token: string;
  user: User;
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  const existing = await users.findByEmail(input.email);
  if (existing) {
    throw new AppError(409, "email already registered");
  }
  // Self-service registration always creates a citizen; authority/admin roles
  // are provisioned out of band by an administrator.
  const passwordHash = await hashPassword(input.password);
  const user = await users.createUser({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
    role: "citizen",
  });
  await writeAudit({
    actorId: user.id,
    action: "user.register",
    entityType: "user",
    entityId: user.id,
  });
  return {
    token: signToken({ sub: user.id, email: user.email, role: user.role }),
    user,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const record = await users.findByEmail(email);
  if (!record) throw new AppError(401, "invalid credentials");
  const ok = await verifyPassword(password, record.passwordHash);
  if (!ok) throw new AppError(401, "invalid credentials");
  const user = users.stripSecret(record);
  return {
    token: signToken({ sub: user.id, email: user.email, role: user.role }),
    user,
  };
}

export async function getProfile(id: string): Promise<User> {
  const user = await users.findById(id);
  if (!user) throw new AppError(404, "user not found");
  return user;
}
