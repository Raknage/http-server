import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "protocol://username:password@host:port/database?sslmode=disable",
  },
});
