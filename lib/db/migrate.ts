import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDbClient } from "./client";

/** Applies lib/db/schema.sql against the configured database. Run via `npm run db:migrate`. */
async function migrate() {
  const schema = readFileSync(join(process.cwd(), "lib/db/schema.sql"), "utf-8");
  const db = getDbClient();
  await db.executeMultiple(schema);
  console.log("Migration complete.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
