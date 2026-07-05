import { query } from "../infrastructure/db.js";
import type { Role, User, UserWithSecret, UUID } from "../domain/user.js";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: Role;
  created_at: string;
};

function mapUser(r: UserRow): UserWithSecret {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
  };
}

export function stripSecret(u: UserWithSecret): User {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    createdAt: u.createdAt,
  };
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
}): Promise<User> {
  const res = await query<UserRow>(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.email.toLowerCase(), input.passwordHash, input.fullName, input.role],
  );
  return stripSecret(mapUser(res.rows[0]));
}

export async function findByEmail(
  email: string,
): Promise<UserWithSecret | null> {
  const res = await query<UserRow>("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  return res.rows[0] ? mapUser(res.rows[0]) : null;
}

export async function findById(id: UUID): Promise<User | null> {
  const res = await query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] ? stripSecret(mapUser(res.rows[0])) : null;
}
