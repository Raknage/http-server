import { Request } from "express";
import { BadRequestError } from "./app/middleware/errorHandler.js";
import { hashPassword } from "./auth.js";

export async function extractCredentials(req: Request) {
  const parsedBody: { email: string; password: string } = req.body;
  if (!parsedBody.password) {
    throw new BadRequestError("Password missing");
  } else if (!parsedBody.email) {
    throw new BadRequestError("Email missing");
  }
  const hashedPassword = await hashPassword(parsedBody.password);
  return {
    email: parsedBody.email,
    password: parsedBody.password,
    hashedPassword,
  };
}
