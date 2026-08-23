import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDbClient } from "./client";

type DbClient = ReturnType<typeof getDbClient>;

/**
 * Columns added to an existing table after its initial release. `CREATE TABLE IF NOT EXISTS`
 * skips a table that already exists, so a database created before one of these columns landed
 * never gains it from schema.sql alone. SQLite has no `ADD COLUMN IF NOT EXISTS`, so each is
 * applied only when `PRAGMA table_info` says it is missing.
 */
const ADDED_COLUMNS: ReadonlyArray<{ table: string; column: string; definition: string }> = [
  { table: "rounds", column: "screenshot_width", definition: "INTEGER" },
  { table: "rounds", column: "screenshot_height", definition: "INTEGER" },
  { table: "rounds", column: "locked_viewport_width", definition: "INTEGER" },
  { table: "rounds", column: "locked_viewport_height", definition: "INTEGER" },
];

async function addMissingColumns(db: DbClient): Promise<void> {
  for (const { table, column, definition } of ADDED_COLUMNS) {
    const info = await db.execute(`PRAGMA table_info(${table})`);
    if (info.rows.some((row) => String(row.name) === column)) continue;
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added ${table}.${column}.`);
  }
}

/** Applies lib/db/schema.sql against the configured database. Run via `npm run db:migrate`. */
async function migrate() {
  const schema = readFileSync(join(process.cwd(), "lib/db/schema.sql"), "utf-8");
  const db = getDbClient();
  await db.executeMultiple(schema);
  await addMissingColumns(db);
  console.log("Migration complete.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
