import { Router } from "express";
import { NotFoundError, UnauthorizedError } from "../app/middleware/errorHandler.js";
import { upgradeUserToChirpyRed } from "../db/queries/users.js";
import { getAPIKey } from "../auth.js";
import config from "../config.js";

type PolkaResponse = {
  event: "user.upgraded";
  data: {
    userId: string;
  };
};

const router = Router();

router.route("/").post(async (req, res, next) => {
  try {
    const apiKey = getAPIKey(req);
    console.log(apiKey);
    console.log(config.api.polkaKey);
    if (apiKey !== config.api.polkaKey) {
      throw new UnauthorizedError("API key mismatch");
    }
    const reqBody: PolkaResponse = req.body;
    if (reqBody.event !== "user.upgraded") {
      res.status(204).send();
      return;
    }

    const upgradedUser = await upgradeUserToChirpyRed(reqBody.data.userId);
    if (!upgradedUser) {
      throw new NotFoundError("User not found");
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
