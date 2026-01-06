import { Router } from "express";
import { checkPasswordHash, makeJWT, makeRefreshToken, getBearerToken } from "../auth.js";
import config from "../config.js";
import {
  createRefreshToken,
  getRefreshToken,
  getUserFromRefreshToken,
  revokeRefreshToken,
} from "../db/queries/tokens.js";
import { getUserByEmail } from "../db/queries/users.js";
import { SelectUser } from "../db/schema.js";

type ReqUser = {
  password: string;
  email: string;
};

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const reqUser: ReqUser = req.body;
    const user: SelectUser = await getUserByEmail(reqUser.email);
    if (await checkPasswordHash(user.hashedPassword, reqUser.password)) {
      const expiry = 3600;
      const jwt = makeJWT(user.id, expiry, config.api.secret);
      const refreshToken = makeRefreshToken();
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      createRefreshToken(refreshToken, user.id, expiresAt);
      const {hashedPassword, ...resUser} = user
      const responseJson = {
        token: jwt,
        refreshToken,
        ...resUser
      };

      console.log(`User login:`);
      console.log(responseJson);

      res.status(200).json(responseJson);
    } else {
      console.log(`Login failed:`);
      console.log(reqUser);

      res.status(401).send("Unathorized");
    }
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const refreshToken = await getRefreshToken(token);
    const today = new Date(Date.now());

    console.log(`Refreshing token:`);
    console.log(`Bearer token: ${token}`);
    console.log(`Resfresh token:`);
    console.log(refreshToken);

    if (refreshToken.revokedAt) {
      console.log(`Refresh token revoked`);
      res.status(401).send("Refresh token revoked");
    } else if (refreshToken.expiresAt < today) {
      console.log(`Refresh token expired`);
      res.status(401).send("Refresh token expired");
    } else {
      const user = await getUserFromRefreshToken(refreshToken.userId);
      console.log(`User from token:`);
      console.log(user);

      const newToken = makeJWT(user.id, 3600, config.api.secret);
      console.log(`New JWT token: ${newToken}`);

      res.status(200).json({ token: newToken });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/revoke", async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const revokedToken = await revokeRefreshToken(token);

    console.log(`Revoke token:`);
    console.log(revokedToken);

    res.status(204).send("OK");
  } catch (error) {
    next(error);
  }
});

export default router;
