import type { MigrationConfig } from "drizzle-orm/migrator";

type APIConfig = {
  fileserverHits: number;
  platform: string;
  secret: string;
  polkaKey: string;
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
const platform = process.env.PLATFORM;
const secret = process.env.SECRET;
const polkaKey = process.env.POLKA_KEY;

export default {
  api: { fileserverHits: 0, platform, secret, polkaKey } as APIConfig,
  db: { migrationConfig, url } as DBConfig,
};
