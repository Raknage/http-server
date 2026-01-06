import { Router } from "express";
import { NotFoundError } from "../app/middleware/errorHandler.js";
import { upgradeUserToChirpyRed } from "../db/queries/users.js";

type PolkaResponse = {
  event: "user.upgraded";
  data: {
    userId: string;
  };
};

const router = Router();

router.route("/").post(async (req, res, next) => {
  try {
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
