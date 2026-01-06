import express from "express";
import config from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { middlewareLogResponses } from "./app/middleware/log.js";
import { middlewareMetricsInc } from "./app/middleware/metrics.js";
import { errorHandler } from "./app/middleware/errorHandler.js";
import adminRouter from "./routes/admin.js";
import chirpsRouter from "./routes/chirps.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

export const app = express();
const PORT = 8080;

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use(express.json());
app.use("/app", express.static("./src/app"));

app.use("/admin", adminRouter);
app.use("/api/chirps", chirpsRouter);
app.use("/api", authRouter);
app.use("/api/users", usersRouter);

app.get("/api/healthz", (req, res) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
