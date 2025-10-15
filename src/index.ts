import express from "express";
import { middlewareLogResponses } from "./app/middleware/log.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);

app.use("/app", express.static("./src/app"));

app.get("/healthz", (req, res) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Server running in port ${PORT}`);
});
