import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "./app/middleware/errorHandler.js";

type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string) {
  const hash = await argon2.hash(password);
  return hash;
}

export async function checkPasswordHash(hash: string, password: string) {
  if (await argon2.verify(hash, password)) {
    return true;
  } else {
    return false;
  }
}

export function makeJWT(userID: string, expiresIn: number = 3600, secret: string) {
  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000 + expiresIn),
  };
  return jwt.sign(payload, secret);
}

export function validateJWT(token: string, secret: string) {
  let decoded: Payload;
  try {
    decoded = jwt.verify(token, secret) as Payload;
  } catch (e) {
    throw new UnauthorizedError("Invalid JWT token");
  }

  if (!decoded) {
    throw new UnauthorizedError("Invalid JWT token");
  } else if (!decoded.sub) {
    throw new NotFoundError("No user ID in JWT token");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authorizationHeader = req.get("Authorization");
  console.log(`Authorization token: ${authorizationHeader}`);
  if (!authorizationHeader) {
    throw new BadRequestError("Missing auth header");
  }
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    throw new BadRequestError("Invalid auth header format");
  }
  return match[1];
}

export function makeRefreshToken() {
  return randomBytes(32).toString("hex");
}
