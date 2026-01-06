import { BadRequestError } from "../app/middleware/errorHandler.js";
import { getBearerToken, validateJWT } from "../auth.js";
import config from "../config.js";
import { createUser, updateUser } from "../db/queries/users.js";
import { SelectUser } from "../db/schema.js";
import { extractCredentials } from "../helpers.js";
import { Router } from "express";

const router = Router();

router
  .route("/")
  .post(async (req, res, next) => {
    try {
      const credentials = await extractCredentials(req);
      const newUser: SelectUser = await createUser({
        email: credentials.email,
        hashedPassword: credentials.hashedPassword,
      });
      if (!newUser) {
        throw new BadRequestError(`User for email ${credentials.email} already exists`);
      }
      console.log(`User created:`);
      console.log(newUser);
      res
        .status(201)
        .json({ id: newUser.id, createdAt: newUser.createdAt, updatedAt: newUser.updatedAt, email: newUser.email });
    } catch (error) {
      next(error);
    }
  })
  .put(async (req, res, next) => {
    try {
      const authToken = getBearerToken(req);
      console.log(`Authorization token: ${authToken}`);

      const userId = validateJWT(authToken, config.api.secret);
      const credentials = await extractCredentials(req);

      const updatedUser = await updateUser(userId, credentials.email, credentials.hashedPassword);
      console.log(updatedUser);
      const { hashedPassword, ...resUser } = updatedUser;
      console.log(resUser);

      res.status(200).json(resUser);
    } catch (error) {
      next(error);
    }
  });

export default router;
