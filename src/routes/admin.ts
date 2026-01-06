import { Router } from "express";
import config from "../config.js";
import { resetUsers } from "../db/queries/users.js";

const router = Router();

// curl -X POST http://localhost:8080/admin/reset
router.post("/reset", async (req, res) => {
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

router.get("/metrics", (req, res) => {
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

export default router;
