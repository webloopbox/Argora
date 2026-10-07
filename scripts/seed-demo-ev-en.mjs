// Seeds a small, public debate about electric cars in English.
// Lighter seed variant - 7 arguments, 2 levels, without a private group.
//
// Requirements:
//   - API running (pnpm dev:api)
//   - Node 18+
//
// Execution:
//   pnpm seed:ev:en
//

import pg from "pg";
import { createApiClient } from "./lib/api-client.mjs";
import { loadEnv } from "./lib/env.mjs";

loadEnv();
const API = process.env.API_URL ?? "http://localhost:3000";
const WEB = process.env.WEB_URL ?? "http://localhost:5173";
const PASSWORD = "haslo1234";

const owner = {
  displayName: "Mark Demo",
  email: "demo-owner-en@brainstorm.test",
};

const voters = [
  { displayName: "Anna Smith", email: "anna.smith@brainstorm.test" },
  { displayName: "John Doe", email: "john.doe@brainstorm.test" },
  { displayName: "Mary Williams", email: "mary.williams@brainstorm.test" },
  { displayName: "Peter Miller", email: "peter.miller@brainstorm.test" },
  { displayName: "Kate Taylor", email: "kate.taylor@brainstorm.test" },
  { displayName: "Thomas Anderson", email: "thomas.anderson@brainstorm.test" },
  { displayName: "Margaret Davis", email: "margaret.davis@brainstorm.test" },
  { displayName: "Christopher Wilson", email: "christopher.wilson@brainstorm.test" },
];

// Small tree: 4 arguments directly under the thesis + 3 replies (L2).
const tree = [
  // ─── L1 (direct children of thesis) ──────────────────────────────────────
  {
    key: "MAIN",
    parent: null,
    side: "pro",
    author: 0,
    votes: 8,
    content:
      "The operating cost of an electric car is significantly lower - electricity is cheaper than fuel, and an electric motor has fewer parts that require servicing.",
  },
  {
    key: "L1.B",
    parent: null,
    side: "pro",
    author: 1,
    votes: 7,
    content:
      "Electric vehicles do not emit exhaust fumes at the point of use, which realistically improves air quality in congested cities.",
  },
  {
    key: "L1.C",
    parent: null,
    side: "against",
    author: 2,
    votes: 6,
    content:
      "Battery production and the extraction of lithium and cobalt have a large environmental footprint that undermines the claim of full eco-friendliness.",
  },
  {
    key: "L1.D",
    parent: null,
    side: "against",
    author: 3,
    votes: 5,
    content:
      "The high purchase price and still insufficient charging network effectively discourage the average driver.",
  },

  // ─── L2 (replies) ─────────────────────────────────────────────────────────
  {
    key: "L2.MAIN.contra",
    parent: "MAIN",
    side: "against",
    author: 4,
    votes: 4,
    content:
      "Fuel savings melt away when charging away from home - commercial fast chargers can be more expensive per kilometer than gasoline.",
  },
  {
    key: "L2.C.rebut",
    parent: "L1.C",
    side: "pro",
    author: 5,
    votes: 4,
    content:
      "The footprint of battery production is amortized after a few years of driving, and used cells go to recycling and energy storage (second-life), closing the raw material loop.",
  },
  {
    key: "L2.D.rebut",
    parent: "L1.D",
    side: "pro",
    author: 6,
    votes: 5,
    content:
      "Government subsidies lower the purchase price, and the network of fast chargers along highways is growing by dozens of percent year-on-year.",
  },
];

const { jsonFetch, registerOrLogin } = createApiClient({
  baseUrl: API,
  password: PASSWORD,
});

async function main() {
  console.log(`→ API: ${API}\n`);

  try {
    const res = await fetch(`${API}/stats`);
    if (!res.ok) throw new Error("unhealthy");
  } catch {
    throw new Error(
      `Cannot connect to API at ${API}. Please run it first: pnpm dev:api`
    );
  }

  console.log("👤  Creating debate author (Mark Demo)...");
  const ownerAuth = await registerOrLogin(owner);

  console.log("💬  Creating public debate...");
  const debate = await jsonFetch("/debates", {
    method: "POST",
    token: ownerAuth.accessToken,
    body: {
      thesis:
        "Electric cars are the best solution for the future of transport.",
      visibility: "public",
      language: "en",
    },
  });
  console.log(`    debate: ${debate.id}\n`);

  console.log(`👥  Registering ${voters.length} voters...`);
  const voterAuths = [];
  for (let i = 0; i < voters.length; i++) {
    voterAuths.push(await registerOrLogin(voters[i]));
    process.stdout.write(`    ${i + 1}/${voters.length}\r`);
  }
  console.log("");

  console.log(`\n🌳  Building argument tree (${tree.length} entries)...`);
  const created = {};
  let mainArgId = null;

  for (const node of tree) {
    const parentArgumentId = node.parent ? created[node.parent].id : null;
    const author = voterAuths[node.author];
    const arg = await jsonFetch(`/debates/${debate.id}/arguments`, {
      method: "POST",
      token: author.accessToken,
      body: {
        side: node.side,
        content: node.content,
        parentArgumentId,
      },
    });
    created[node.key] = arg;
    if (node.key === "MAIN") mainArgId = arg.id;

    const depth = node.parent ? 2 : 1;
    process.stdout.write(
      `    [L${depth}] ${node.key.padEnd(20)} ${node.side.toUpperCase().padEnd(8)}\n`
    );
  }

  console.log(`\n🗳️   Casting votes on the tree...`);
  for (const node of tree) {
    const arg = created[node.key];
    const idxs = [...Array(voterAuths.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, node.votes);
    let cast = 0;
    for (const i of idxs) {
      const value = node.key === "MAIN" ? 1 : Math.random() > 0.3 ? 1 : -1;
      try {
        await jsonFetch(`/arguments/${arg.id}/votes`, {
          method: "POST",
          token: voterAuths[i].accessToken,
          body: { value },
        });
        cast++;
      } catch {
        // ignore
      }
    }
    process.stdout.write(`    ${node.key.padEnd(20)} → ${cast} votes\n`);
  }

  console.log("\n🔍  Verifying final weight of main argument...");
  const allArgs = await jsonFetch(`/debates/${debate.id}/arguments`, {
    token: ownerAuth.accessToken,
  });
  const finalMain = allArgs.find((a) => a.id === mainArgId);

  const { Client } = pg;
  const dbUrl = process.env.DATABASE_URL;
  const watsonxKey = process.env.IBM_CLOUD_API_KEY;
  const watsonxProject = process.env.WATSONX_PROJECT_ID;
  const watsonxUrl = process.env.WATSONX_URL;

  if (dbUrl && watsonxKey && watsonxProject && watsonxUrl) {
    console.log(
      `\n🧩  Populating vectors (embeddings) for arguments...`
    );
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await new Promise((r) => setTimeout(r, 2000));

    const queryRes = await client.query(
      `SELECT id, content FROM arguments WHERE debate_id = $1 AND embedding IS NULL`,
      [debate.id],
    );

    if (queryRes.rows.length > 0) {
      const tokenRes = await fetch("https://iam.cloud.ibm.com/identity/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${watsonxKey}`,
      });
      const { access_token: token } = await tokenRes.json();

      let successCount = 0;
      for (const row of queryRes.rows) {
        try {
          const embedRes = await fetch(
            `${watsonxUrl}/ml/v1/text/embeddings?version=2024-05-31`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model_id: "ibm/granite-embedding-278m-multilingual",
                project_id: watsonxProject,
                inputs: [row.content],
              }),
            },
          );
          const embedJson = await embedRes.json();
          const embedding = embedJson.results?.[0]?.embedding;
          if (embedding && embedding.length > 0) {
            await client.query(
              `UPDATE arguments SET embedding = $1::jsonb WHERE id = $2`,
              [JSON.stringify(embedding), row.id],
            );
            successCount++;
          }
        } catch {
          // ignore
        }
        // Lite plan allows 2 req/s - stay well under it.
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      console.log(
        `    Vectors populated (${successCount}/${queryRes.rows.length}).`
      );
    } else {
      console.log(`    All vectors generated by API in background.`);
    }
    await client.end();
  } else {
    console.log(
      `\n⚠️   Missing DATABASE_URL / IBM_CLOUD_API_KEY / WATSONX_PROJECT_ID / WATSONX_URL. Skipped vector generation.`
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅  DEMO READY - small public debate on electric cars");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📍  Open in browser:`);
  console.log(`    ${WEB}/dyskusje/${debate.id}\n`);
  console.log(
    `    main argument weight:       ${finalMain?.weight ?? "?"}  (expected: 8)`
  );
  console.log(
    `    total arguments in graph:   ${allArgs.length}  (expected: ${tree.length})\n`
  );
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
