import express from "express";
import config from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { middlewareLogResponses } from "./app/middleware/log.js";
import { middlewareMetricsInc } from "./app/middleware/metrics.js";
import { BadRequestError, errorHandler, UnauthorizedError } from "./app/middleware/errorHandler.js";
import { createUser, getUserByEmail, resetUsers, updateUser } from "./db/queries/users.js";
import { createChirp, getChirpById, getChirps } from "./db/queries/chirps.js";
import { checkPasswordHash, getBearerToken, makeJWT, makeRefreshToken, validateJWT } from "./auth.js";
import { SelectUser } from "./db/schema.js";
import {
  createRefreshToken,
  getRefreshToken,
  getUserFromRefreshToken,
  revokeRefreshToken,
} from "./db/queries/tokens.js";
import { extractCredentials } from "./helpers.js";

const app = express();
const PORT = 8080;

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use(express.json());
app.use("/app", express.static("./src/app"));

type UserResponse = Omit<SelectUser, "hashedPassword">;

type Chirp = {
  body: string;
  userId: string;
};

type ReqUser = {
  password: string;
  email: string;
};

// curl -X POST -H "Content-Type: application/json" -d '{"email":"example@email.com","password":"password123"}' http://localhost:8080/api/users
app.post("/api/users", async (req, res, next) => {
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
});

app.post("/api/login", async (req, res, next) => {
  try {
    const reqUser: ReqUser = req.body;
    const user: SelectUser = await getUserByEmail(reqUser.email);
    if (await checkPasswordHash(user.hashedPassword, reqUser.password)) {
      const expiry = 3600;
      const jwt = makeJWT(user.id, expiry, config.api.secret);
      const refreshToken = makeRefreshToken();
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      createRefreshToken(refreshToken, user.id, expiresAt);
      const responseJson = {
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.email,
        token: jwt,
        refreshToken,
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

app.post("/api/refresh", async (req, res, next) => {
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

app.post("/api/revoke", async (req, res, next) => {
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

app.get("/api/healthz", (req, res) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
});

app.get("/admin/metrics", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
    <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
      </body>
    </html>
    `);
});

// curl -X POST http://localhost:8080/admin/reset
app.post("/admin/reset", async (req, res) => {
  if (config.api.platform !== "dev") {
    res.status(403).send("Forbidden\n");
    return;
  }

  const deletedUsers = await resetUsers();
  console.log("deleted users:");
  for (const user of deletedUsers) {
    console.log(`  - ${user.email}`);
  }

  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(`Hits: ${config.api.fileserverHits}\n`);
});

app.get("/api/chirps", async (req, res, next) => {
  try {
    const chirps = await getChirps();
    res.header("Content-Type", "application/json");
    res.status(200).json(chirps);
  } catch (error) {
    next(error);
  }
});

app.get("/api/chirps/:chirpID", async (req, res, next) => {
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

// curl -X POST -H "Content-Type: application/json" -d '{"body":"Hello, world!","userId":"8ce57066-a19e-4528-a83b-4a25e1ec7c24"}' http://localhost:8080/api/chirps
app.post("/api/chirps", async (req, res, next) => {
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

app.put("/api/users", async (req, res, next) => {
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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
