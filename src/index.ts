import express from "express";
import { middlewareLogResponses } from "./app/middleware/log.js";
import { middlewareMetricsInc } from "./app/middleware/metrics.js";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);

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

app.post("/api/validate_chirp", (req, res) => {
  let reqBody = "";

  req.on("data", (chunk) => {
    reqBody += chunk;
  });

  req.on("end", () => {
    try {
      const parsedBody: { body: string } = JSON.parse(reqBody);
      res.header("Content-Type", "application/json");

      if (parsedBody.body.length > 140) {
        const body = JSON.stringify({
          error: "Chirp is too long",
        });
        res.status(400).send(body);
        return;
      }

      const body = JSON.stringify({
        valid: true,
      });

      res.status(200).send(body);
    } catch (error) {
      res.status(400).send("Invalid JSON");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
