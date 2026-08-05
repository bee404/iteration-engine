import { createClient, type Client } from "@libsql/client";

/**
 * Turso client. Falls back to a local SQLite file (./local.db) when
 * TURSO_DATABASE_URL is unset, so `npm run dev` works with zero configured
 * credentials. Point TURSO_DATABASE_URL / TURSO_AUTH_TOKEN at a real Turso
 * database (see .env.local.example) to persist against the edge instead.
 */
let client: Client | undefined;

export function getDbClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  client = createClient(
    url.startsWith("file:") ? { url } : { url, authToken },
  );

  return client;
}
