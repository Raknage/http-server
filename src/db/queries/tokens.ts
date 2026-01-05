import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { refreshTokens, users } from "../schema.js";

export async function createRefreshToken(token: string, userId: string, expiresAt: Date) {
  const [result] = await db.insert(refreshTokens).values({ token, userId, expiresAt });
}

export async function getRefreshToken(token: string) {
  const [result] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
  return result;
}

export async function getUserFromRefreshToken(userId: string) {
  const [result] = await db.select().from(users).where(eq(users.id, userId));
  return result;
}

export async function revokeRefreshToken(token: string) {
  const [result] = await db
    .update(refreshTokens)
    .set({ revokedAt: sql`NOW()` })
    .where(eq(refreshTokens.token, token))
    .returning();
  return result;
}
