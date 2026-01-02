import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT } from "./auth";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(hash1, password1);
    expect(result).toBe(true);
  });
  it("should return false for the incorrect password", async () => {
    const result = await checkPasswordHash(hash2, password1);
    expect(result).toBe(false);
  });
});

describe("JWT", () => {
  const secret = "supersecret";
  const userId = "user123";

  it("should create and validate a JWT", () => {
    const token = makeJWT(userId, 3600, secret);
    const decodedId = validateJWT(token, secret);
    expect(decodedId).toBe(userId);
  });

  it("should reject expired tokens", () => {
    const token = makeJWT(userId, -100, secret);
    expect(() => validateJWT(token, secret)).toThrow();
  });

  it("should reject JWTs signed with the wrong secret", () => {
    const token = makeJWT(userId, 3600, secret);
    const wrongSecret = "wrongsecret";
    expect(() => validateJWT(token, wrongSecret)).toThrow();
  });
});
