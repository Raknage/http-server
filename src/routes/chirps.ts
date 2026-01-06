import { UnauthorizedError, BadRequestError, ForbiddenError, NotFoundError } from "../app/middleware/errorHandler.js";
import { getBearerToken, validateJWT } from "../auth.js";
import config from "../config.js";
import { getChirps, createChirp, getChirpById, deleteChirp } from "../db/queries/chirps.js";
import { Router } from "express";

const router = Router();

type Chirp = {
  body: string;
  userId: string;
};

router
  .route("/")
  .get(async (req, res, next) => {
    try {
      let authorId = "";
      let authorIdQuery = req.query.authorId;
      if (typeof authorIdQuery === "string") {
        authorId = authorIdQuery;
      }

      const chirps = await getChirps(authorId ? authorId : null);

      res.header("Content-Type", "application/json");
      res.status(200).json(chirps);
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    try {
      const token = getBearerToken(req);
      console.log(`validating token: ${token}`);
      const validatedUserId = validateJWT(token, config.api.secret);
      console.log(`Validated user ID: ${validatedUserId}`);
      if (!validatedUserId) {
        throw new UnauthorizedError("JWT validation failed");
      }
      const parsedBody: Chirp = req.body;
      res.header("Content-Type", "application/json");

      if (parsedBody.body.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
      }

      const profane = ["kerfuffle", "sharbert", "fornax"];
      let cleanedBody = parsedBody.body;

      for (const word of profane) {
        const regex = new RegExp(word, "gi");
        cleanedBody = cleanedBody.replace(regex, "****");
      }

      const newChirp = await createChirp({ body: cleanedBody, userId: validatedUserId });

      res.status(201).json(newChirp);
    } catch (error) {
      next(error);
    }
  });

router
  .route("/:chirpID")
  .get(async (req, res, next) => {
    try {
      const chirp = await getChirpById(req.params.chirpID);
      if (!chirp) {
        throw new NotFoundError("Not found");
      }

      res.header("Content-Type", "application/json");
      res.status(200).json(chirp);
    } catch (error) {
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const token = getBearerToken(req);
      console.log(`validating token: ${token}`);
      const validatedUserId = validateJWT(token, config.api.secret);
      console.log(`Validated user ID: ${validatedUserId}`);
      if (!validatedUserId) {
        throw new ForbiddenError("JWT validation failed");
      }

      const chirp = await getChirpById(req.params.chirpID);
      if (!chirp) {
        throw new NotFoundError("Chirp not found");
      }

      if (chirp.userId !== validatedUserId) {
        throw new ForbiddenError("Wrong user ID");
      }

      console.log("Deleting chirp:");
      const deletedChirp = await deleteChirp(chirp.id);
      console.log(deletedChirp);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

export default router;
