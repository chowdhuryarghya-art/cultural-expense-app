import { createHash } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";

export interface AuthenticatedRequest extends Request {
  auth?: {
    sessionId: number;
    userId: number;
    displayName: string;
    email: string;
  };
}

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/);
  if (!match) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const tokenHash = hashSessionToken(match[1]);
    const result = await pool.query(
      `SELECT s.id AS session_id, u.id AS user_id, u.display_name, u.email
       FROM cultural.auth_sessions s
       JOIN cultural.app_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    const request = req as AuthenticatedRequest;
    request.auth = {
      sessionId: Number(result.rows[0].session_id),
      userId: Number(result.rows[0].user_id),
      displayName: result.rows[0].display_name,
      email: result.rows[0].email,
    };
    return next();
  } catch (error) {
    console.error("Authentication lookup failed", error);
    return res.status(500).json({ error: "Could not verify session" });
  }
}
