import type { MigrationConfig } from "drizzle-orm/migrator";

type APIConfig = {
  fileserverHits: number;
};

type DBConfig = {
  migrationConfig: MigrationConfig;
  url: string;
};

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./drizzle",
};

process.loadEnvFile();
if (!process.env.DB_URL) {
  throw new Error(".env file not found");
}
const url: string = process.env.DB_URL;

export default {
  api: { fileserverHits: 0 } as APIConfig,
  db: { migrationConfig, url } as DBConfig,
};
