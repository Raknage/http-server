process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
};

if (!process.env.DB_URL) {
  throw new Error(".env file not found");
}

export const config: APIConfig = { fileserverHits: 0, dbURL: process.env.DB_URL };
