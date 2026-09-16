import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { sendPasswordResetEmail } from "./email";
import { SITE_URL } from "./site";

export const SESSION_COOKIE = "campai_session";
const SESSION_DAYS = 30;
const RESET_TOKEN_HOURS = 1;

export type UserRole = "builder" | "judge";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  handle: string;
  is_admin: boolean;
  avatar_path: string;
}

async function uniqueHandle(name: string): Promise<string> {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "builder";

  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await pool.query("select 1 from users where handle = $1", [candidate]);
    if (!existing.rowCount) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function signup(
  name: string,
  email: string,
  password: string,
  role: UserRole,
  handleInput?: string
): Promise<{ error: string } | { user: AuthUser }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!name.trim()) return { error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (role !== "builder" && role !== "judge") return { error: "Choose a valid role." };

  const existing = await pool.query("select id from users where email = $1", [cleanEmail]);
  if (existing.rowCount) return { error: "An account with that email already exists. Log in instead." };

  const cleanHandle = (handleInput ?? "").trim().toLowerCase();
  let handle: string;
  if (cleanHandle) {
    if (!/^[a-z0-9-]{3,24}$/.test(cleanHandle)) {
      return { error: "Handle must be 3-24 characters: lowercase letters, numbers, and hyphens only." };
    }
    const existingHandle = await pool.query("select id from users where handle = $1", [cleanHandle]);
    if (existingHandle.rowCount) return { error: "That handle is taken. Try another." };
    handle = cleanHandle;
  } else {
    handle = await uniqueHandle(name);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "insert into users (name, email, password_hash, role, handle) values ($1, $2, $3, $4, $5) returning id, name, email, role, handle, is_admin, avatar_path",
    [name.trim(), cleanEmail, passwordHash, role, handle]
  );
  const user = result.rows[0] as AuthUser;
  await createSession(user.id);
  return { user };
}

export async function login(email: string, password: string): Promise<{ error: string } | { user: AuthUser }> {
  const cleanEmail = email.trim().toLowerCase();
  const result = await pool.query(
    "select id, name, email, password_hash, role, handle, is_admin, avatar_path from users where email = $1",
    [cleanEmail]
  );
  const row = result.rows[0];
  if (!row) return { error: "No account with that email." };

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return { error: "Wrong password." };

  const user: AuthUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    handle: row.handle,
    is_admin: row.is_admin,
    avatar_path: row.avatar_path,
  };
  await createSession(user.id);
  return { user };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const result = await pool.query<{ id: string }>("select id from users where email = $1", [cleanEmail]);
  const user = result.rows[0];
  if (!user) return; // don't reveal whether the email exists

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);
  await pool.query(
    "insert into password_resets (token, user_id, expires_at) values ($1, $2, $3)",
    [token, user.id, expiresAt]
  );

  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(cleanEmail, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<{ error: string } | { ok: true }> {
  if (!token) return { error: "Missing reset token." };

  const result = await pool.query<{ user_id: string; expires_at: string }>(
    "select user_id, expires_at from password_resets where token = $1",
    [token]
  );
  const row = result.rows[0];
  if (!row || new Date(row.expires_at) < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query("update users set password_hash = $1 where id = $2", [passwordHash, row.user_id]);
  await pool.query("delete from password_resets where token = $1", [token]);
  await pool.query("delete from sessions where user_id = $1", [row.user_id]);

  return { ok: true };
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await pool.query("insert into sessions (token, user_id, expires_at) values ($1, $2, $3)", [token, userId, expiresAt]);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await pool.query("delete from sessions where token = $1", [token]);
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await pool.query(
    `select u.id, u.name, u.email, u.role, u.handle, u.is_admin, u.avatar_path from sessions s
     join users u on u.id = s.user_id
     where s.token = $1 and s.expires_at > now()`,
    [token]
  );
  return (result.rows[0] as AuthUser) ?? null;
}
