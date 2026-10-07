// Recomputes embeddings for arguments that already have one stored (from a
// previous provider) plus any that never got one. Needed whenever
// EMBEDDING_PROVIDER changes, because vectors from different embedding
// models live in different vector spaces and are not comparable - leaving
// old vectors in place would make duplicate detection silently compare
// incompatible embeddings.
//
// Execution:
//   node scripts/reembed-existing.mjs [debateId]
//
// Without an argument, re-embeds every non-archived argument in the database.

import { GoogleGenAI } from "@google/genai";
import pg from "pg";
import { loadEnv } from "./lib/env.mjs";

loadEnv();

const debateId = process.argv[2] ?? null;
const geminiKey = process.env.GEMINI_API_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!geminiKey) throw new Error("GEMINI_API_KEY not set in .env");
if (!dbUrl) throw new Error("DATABASE_URL not set in .env");

const client = new pg.Client({ connectionString: dbUrl });
const ai = new GoogleGenAI({ apiKey: geminiKey });

async function main() {
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
  console.log(`Re-embedding ${rows.length} argument(s) with Gemini...`);

  let ok = 0;
  for (const row of rows) {
    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: row.content,
      });
      const vector = response.embeddings?.[0]?.values;
      if (!vector || vector.length === 0) {
        console.warn(`  ${row.id}: empty embedding returned, skipped`);
        continue;
      }
      await client.query(`UPDATE arguments SET embedding = $1::jsonb WHERE id = $2`, [
        JSON.stringify(vector),
        row.id,
      ]);
      ok++;
      process.stdout.write(`  ${ok}/${rows.length}\r`);
    } catch (err) {
      console.warn(`  ${row.id}: failed - ${err.message}`);
    }
    // Stay well under Gemini's free-tier rate limit.
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone: ${ok}/${rows.length} embeddings updated.`);
  await client.end();
}

main().catch((err) => {
  console.error("Re-embed failed:", err.message);
  process.exit(1);
});
