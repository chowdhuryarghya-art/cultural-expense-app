import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db";
import {
  AuthenticatedRequest,
  hashSessionToken,
  requireAuthentication,
} from "../middleware/authentication";

const router = express.Router();
const passwordPattern = /^.{10,128}$/s;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const derivePasswordKey = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) reject(error);
        else resolve(key as Buffer);
      },
    );
  });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await derivePasswordKey(password, salt);

  return `scrypt$16384$8$1$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, cost, blockSize, parallelization, saltValue, keyValue] =
    storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    cost !== "16384" ||
    blockSize !== "8" ||
    parallelization !== "1" ||
    !saltValue ||
    !keyValue
  ) {
    return false;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const storedKey = Buffer.from(keyValue, "base64url");
  if (salt.length !== 16 || storedKey.length !== 64) return false;

  const derivedKey = await derivePasswordKey(password, salt);

  return timingSafeEqual(derivedKey, storedKey);
}

async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  await pool.query(
    `INSERT INTO cultural.auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, tokenHash],
  );
  return token;
}

const userResponse = (user: {
  id: number;
  display_name: string;
  email: string;
}) => ({
  id: Number(user.id),
  displayName: user.display_name,
  email: user.email,
});

router.post("/register", registrationLimiter, async (req, res) => {
  const displayName =
    typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!displayName || displayName.length > 100) {
    return res.status(400).json({
      error: "Name is required and must be 100 characters or fewer",
    });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (!passwordPattern.test(password)) {
    return res.status(400).json({
      error: "Password must be between 10 and 128 characters",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await hashPassword(password);
    const result = await client.query(
      `INSERT INTO cultural.app_users (display_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, display_name, email`,
      [displayName, email, passwordHash],
    );
    const user = result.rows[0];
    const token = randomBytes(32).toString("base64url");
    await client.query(
      `INSERT INTO cultural.auth_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, hashSessionToken(token)],
    );
    await client.query("DELETE FROM cultural.auth_sessions WHERE expires_at <= NOW()");
    await client.query("COMMIT");
    return res.status(201).json({ token, user: userResponse(user) });
  } catch (error) {
    await client.query("ROLLBACK");
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("Account registration failed", error);
    return res.status(500).json({ error: "Could not create account" });
  } finally {
    client.release();
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (email.length > 254 || !emailPattern.test(email) || !passwordPattern.test(password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  try {
    const result = await pool.query(
      `SELECT id, display_name, email, password_hash
       FROM cultural.app_users
       WHERE email = $1`,
      [email],
    );
    if (
      result.rows.length === 0 ||
      !(await verifyPassword(password, result.rows[0].password_hash))
    ) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const token = await createSession(Number(user.id));
    await pool.query("DELETE FROM cultural.auth_sessions WHERE expires_at <= NOW()");
    return res.json({ token, user: userResponse(user) });
  } catch (error) {
    console.error("Login failed", error);
    return res.status(500).json({ error: "Could not sign in" });
  }
});

router.get("/me", requireAuthentication, (req, res) => {
  const request = req as AuthenticatedRequest;
  return res.json({
    id: request.auth?.userId,
    displayName: request.auth?.displayName,
    email: request.auth?.email,
  });
});

router.post("/logout", requireAuthentication, async (req, res) => {
  const request = req as AuthenticatedRequest;
  try {
    await pool.query(
      "DELETE FROM cultural.auth_sessions WHERE id = $1",
      [request.auth?.sessionId],
    );
    return res.status(204).end();
  } catch (error) {
    console.error("Logout failed", error);
    return res.status(500).json({ error: "Could not sign out" });
  }
});

export default router;
