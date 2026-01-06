import { UnauthorizedError, BadRequestError } from "../app/middleware/errorHandler.js";
import { getBearerToken, validateJWT } from "../auth.js";
import config from "../config.js";
import { getChirps, createChirp, getChirpById } from "../db/queries/chirps.js";
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
      const chirps = await getChirps();
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
        res.status(401).send("Invalid JWT");
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

router.get("/:chirpID", async (req, res, next) => {
  try {
    const chirp = await getChirpById(req.params.chirpID);
    if (!chirp) {
      res.status(404).send("Not found");
      return;
    }

    res.header("Content-Type", "application/json");
    res.status(200).json(chirp);
  } catch (error) {
    next(error);
  }
});

export default router;
