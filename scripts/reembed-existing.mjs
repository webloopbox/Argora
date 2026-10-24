// Recomputes embeddings for arguments that already have one stored (from a
// previous provider) plus any that never got one. Needed whenever
// EMBEDDING_PROVIDER changes, because vectors from different embedding
// models live in different vector spaces and are not comparable - leaving
// old vectors in place would make duplicate detection silently compare
// incompatible embeddings.
//
// The vendor is read from EMBEDDING_PROVIDER, the same variable the API uses,
// so this script cannot write vectors the API would not understand.
//
// Execution:
//   node scripts/reembed-existing.mjs [debateId]
//
// Without an argument, re-embeds every non-archived argument in the database.
// Archived rows keep their old vectors: nothing compares against them, and
// rewriting them would cost a full pass for no effect.

import pg from "pg";
import { loadEnv } from "./lib/env.mjs";
import { createEmbedder } from "./lib/embedder.mjs";

loadEnv();

const debateId = process.argv[2] ?? null;
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error("DATABASE_URL not set in .env");

const client = new pg.Client({ connectionString: dbUrl });

async function main() {
  const embedder = await createEmbedder();
  await client.connect();

  const query = debateId
    ? {
        text: `SELECT id, content FROM arguments WHERE debate_id = $1 AND archived_on IS NULL`,
        values: [debateId],
      }
    : {
        text: `SELECT id, content FROM arguments WHERE archived_on IS NULL`,
        values: [],
      };

  const { rows } = await client.query(query);
  console.log(
    `Re-embedding ${rows.length} argument(s) with ${embedder.vendor} (${embedder.model})...`,
  );

  let ok = 0;
  let dims = null;
  for (const row of rows) {
    try {
      const vector = await embedder.embed(row.content);
      if (!vector || vector.length === 0) {
        console.warn(`  ${row.id}: empty embedding returned, skipped`);
        continue;
      }
      dims ??= vector.length;
      await client.query(`UPDATE arguments SET embedding = $1::jsonb WHERE id = $2`, [
        JSON.stringify(vector),
        row.id,
      ]);
      ok++;
      process.stdout.write(`  ${ok}/${rows.length}\r`);
    } catch (err) {
      console.warn(`  ${row.id}: failed - ${err.message}`);
    }
    if (embedder.delayMs) {
      await new Promise((r) => setTimeout(r, embedder.delayMs));
    }
  }

  console.log(`\nDone: ${ok}/${rows.length} embeddings updated (${dims} dimensions).`);
  if (ok < rows.length) {
    console.warn(
      `WARNING: ${rows.length - ok} argument(s) still carry a vector from another ` +
        `model and will produce meaningless similarities. Re-run before relying on the gate.`,
    );
  }
  await client.end();
}

main().catch((err) => {
  console.error("Re-embed failed:", err.message);
  process.exit(1);
});
