import express from "express";
import { middlewareLogResponses } from "./app/middleware/log.js";
import { middlewareMetricsInc } from "./app/middleware/metrics.js";
import { BadRequestError, errorHandler } from "./app/middleware/errorHandler.js";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use(express.json());
app.use("/app", express.static("./src/app"));

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
        <p>Chirpy has been visited ${config.fileserverHits} times!</p>
      </body>
    </html>
    `);
});

app.post("/admin/reset", (req, res) => {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(`Hits: ${config.fileserverHits}\n`);
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
