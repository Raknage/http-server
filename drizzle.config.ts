import { defineConfig } from "drizzle-kit";

process.loadEnvFile();

if (!process.env.DB_URL) {
  throw new Error(".env file not found");
}

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL,
  },
});
