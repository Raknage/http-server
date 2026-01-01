import express from "express";
import config from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { middlewareLogResponses } from "./app/middleware/log.js";
import { middlewareMetricsInc } from "./app/middleware/metrics.js";
import { BadRequestError, errorHandler } from "./app/middleware/errorHandler.js";
import { createUser, resetUsers } from "./db/queries/users.js";

const app = express();
const PORT = 8080;

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use(express.json());
app.use("/app", express.static("./src/app"));

// curl -X POST -H "Content-Type: application/json" -d '{"email":"example@email.com"}' http://localhost:8080/api/users
app.post("/api/users", async (req, res, next) => {
  try {
    const parsedBody: { email: string } = req.body;
    const newUser = await createUser({ email: parsedBody.email });
    if (!newUser) {
      throw new Error(`User for email ${parsedBody.email} already exists`);
    }
    res.status(201).json(newUser);
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

  // Update the POST /admin/reset endpoint to delete all users in the database (but don't mess with the schema). You'll need a new query for this.
  const deletedUsers = await resetUsers();
  console.log(deletedUsers);

  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(`Hits: ${config.api.fileserverHits}\n`);
});

app.post("/api/validate_chirp", (req, res, next) => {
  try {
    const parsedBody: { body: string } = req.body;
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

    const body = JSON.stringify({
      cleanedBody,
    });

    res.status(200).send(body);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
