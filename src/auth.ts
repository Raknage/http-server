import * as argon2 from "argon2";
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

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

export function makeJWT(userID: string, expiresIn: number, secret: string) {
  const payload: Payload = {
    iss: "chirpy",
    sub: userID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000 + expiresIn),
  };
  return jwt.sign(payload, secret);
}

export function validateJWT(token: string, secret: string) {
  const decoded = jwt.verify(token, secret) as Payload;

  if (!decoded) {
    throw new Error("Invalid JWT token");
  } else if (!decoded.sub) {
    throw new Error("No user ID in JWT token");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authorizationHeader = req.get("Authorization");
  if (!authorizationHeader) {
    throw new Error("Missing auth header");
  }
  const tokenString = authorizationHeader.replace("Bearer ", "");
  return tokenString;
}
