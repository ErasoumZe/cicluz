import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { loadServerEnv } from "./env";

loadServerEnv();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const parsedUrl = new URL(connectionString);
const parsedPort = parsedUrl.port ? Number(parsedUrl.port) : 5432;
const resolvedPort = Number.isFinite(parsedPort) ? parsedPort : 5432;
const useSsl = parsedUrl.hostname.includes("supabase.co");
const databaseName = parsedUrl.pathname.replace("/", "") || "postgres";

export const pool = new Pool({
  host: parsedUrl.hostname,
  port: resolvedPort,
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: databaseName,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
