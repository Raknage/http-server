import { asc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { chirps, NewChirp, SelectChirp } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db.insert(chirps).values({ body: chirp.body, userId: chirp.userId }).returning();
  return result;
}

export async function getChirps(authorId: string | null) {
  let result: SelectChirp[];

  if (authorId) {
    result = await db.select().from(chirps).where(eq(chirps.userId, authorId)).orderBy(asc(chirps.createdAt));
  } else {
    result = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
  }

  return result;
}

export async function getChirpById(chirpID: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpID));
  return result;
}

export async function deleteChirp(chirpId: string) {
  const [result] = await db.delete(chirps).where(eq(chirps.id, chirpId)).returning();
  return result;
}
