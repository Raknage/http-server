import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, getAPIKey, getBearerToken, hashPassword, makeJWT, validateJWT } from "./auth";
import { request, Request } from "express";

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

describe("Auth token", () => {
  it("should return auth token", () => {
    const token = "some_token";
    const req = {
      get: (header: string) => {
        if (header === "Authorization") return `Bearer ${token}`;
        return undefined;
      },
    } as unknown as Request;

    expect(getBearerToken(req)).toBe(token);
  });

  it("should throw error if auth header is missing", () => {
    const req = {
      get: (header: string) => undefined,
    } as unknown as Request;

    expect(() => getBearerToken(req)).toThrow("Missing or malformed token");
  });

  it("should throw error if auth header is malformed", () => {
    const req = {
      get: (header: string) => "Bearer",
    } as unknown as Request;

    expect(() => getBearerToken(req)).toThrow("Invalid auth header format");
  });
});

describe("API key", () => {
  it("should return API key", () => {
    const token = "kj2351hlk3215h";
    const req = {
      get: (header: string) => {
        if (header === "Authorization") return `ApiKey ${token}`;
        return undefined;
      },
    } as unknown as Request;

    expect(getAPIKey(req)).toBe(token);
  });

  it("should throw error if auth header is missing", () => {
    const req = {
      get: (header: string) => undefined,
    } as unknown as Request;

    expect(() => getAPIKey(req)).toThrow("Missing API key");
  });

  it("should throw error if auth header is malformed", () => {
    const req = {
      get: (header: string) => "ApiKey",
    } as unknown as Request;

    expect(() => getAPIKey(req)).toThrow("Invalid auth header format");
  });
});
