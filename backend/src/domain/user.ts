export type UUID = string;

export type Role = "citizen" | "authority" | "admin";
export const ROLES: readonly Role[] = ["citizen", "authority", "admin"];

export interface User {
  id: UUID;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface UserWithSecret extends User {
  passwordHash: string;
}
