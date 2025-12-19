/// <reference types="node" />

import { defineConfig } from "drizzle-kit";
import { loadServerEnv } from "./server/env";

loadServerEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const parsedUrl = new URL(databaseUrl);
const parsedPort = parsedUrl.port ? Number(parsedUrl.port) : 5432;
const resolvedPort = Number.isFinite(parsedPort) ? parsedPort : 5432;
const useSsl = parsedUrl.hostname.includes("supabase.co");
const databaseName = parsedUrl.pathname.replace("/", "") || "postgres";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: parsedUrl.hostname,
    port: resolvedPort,
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: databaseName,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  },
});
