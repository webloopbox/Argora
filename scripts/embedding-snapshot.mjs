// Saves or restores the `arguments.embedding` column.
//
// Changing EMBEDDING_PROVIDER means recomputing every vector, which destroys
// the previous provider's output. That is normally fine - vectors are derived
// data - but only while the provider that produced them is still reachable.
// Once a vendor's key expires or its quota runs out, the stored vectors are
// the last copy of that model's output and cannot be regenerated at all.
// Taking a snapshot first keeps the switch reversible, and keeps measurements
// taken against the old model reproducible.
//
// Execution:
//   node scripts/embedding-snapshot.mjs save [label]
//   node scripts/embedding-snapshot.mjs restore <file>
//
// `save` writes db/backup/embeddings-<label>.json.gz. `restore` writes every
// vector in the file back, matched by argument id, and reports ids that no
// longer exist rather than failing on them.

import pg from "pg";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { loadEnv } from "./lib/env.mjs";

loadEnv();

const BACKUP_DIR = "db/backup";
const mode = process.argv[2];
const arg = process.argv[3];
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error("DATABASE_URL not set in .env");
if (mode !== "save" && mode !== "restore") {
  console.error("Usage: node scripts/embedding-snapshot.mjs save [label] | restore <file>");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });
const asVector = (v) => (typeof v === "string" ? JSON.parse(v) : v);

async function save(label) {
  const { rows } = await client.query(
    `SELECT id, embedding FROM arguments WHERE embedding IS NOT NULL ORDER BY id`,
  );
  if (rows.length === 0) throw new Error("No embeddings stored - nothing to save");

  const dimensions = asVector(rows[0].embedding).length;
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const out = `${BACKUP_DIR}/embeddings-${label}.json.gz`;
  writeFileSync(
    out,
    gzipSync(
      Buffer.from(
        JSON.stringify({
          // The label names the provider that produced these vectors, which is
          // not necessarily the one now configured - a snapshot is usually
          // taken right after .env has already been pointed elsewhere.
          provider: label,
          dimensions,
          savedAt: new Date().toISOString(),
          rows,
        }),
      ),
    ),
  );
  console.log(`Saved ${rows.length} vector(s), ${dimensions} dimensions -> ${out}`);
}

async function restore(file) {
  const snapshot = JSON.parse(gunzipSync(readFileSync(file)).toString());
  console.log(
    `Restoring ${snapshot.rows.length} vector(s) from ${snapshot.provider} ` +
      `(${snapshot.dimensions} dimensions), saved ${snapshot.savedAt}`,
  );

  let ok = 0;
  let missing = 0;
  for (const row of snapshot.rows) {
    const res = await client.query(
      `UPDATE arguments SET embedding = $1::jsonb WHERE id = $2`,
      [JSON.stringify(asVector(row.embedding)), row.id],
    );
    if (res.rowCount === 1) ok++;
    else missing++;
  }
  console.log(`Restored ${ok} vector(s)${missing ? `, ${missing} id(s) no longer exist` : ""}`);
  console.log(
    `Remember to set EMBEDDING_PROVIDER back to ${snapshot.provider}; ` +
      `the duplicate threshold follows the provider automatically.`,
  );
}

async function main() {
  await client.connect();
  try {
    if (mode === "save") await save(arg ?? process.env.EMBEDDING_PROVIDER ?? "snapshot");
    else {
      if (!arg) throw new Error("restore needs a file path");
      await restore(arg);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(`${mode} failed:`, err.message);
  process.exit(1);
});
