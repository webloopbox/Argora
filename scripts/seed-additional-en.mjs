// Seeds 7 public debates in English:
// 1. Remote work vs office work
// 2. AI replacing software engineers
// 3. Social media harm vs benefit
// 4. Cryptocurrency future
// 5. Universal Basic Income (UBI)
// 6. Nuclear energy for net-zero
// 7. Space exploration value
//
// Requirements:
//   - API running (pnpm dev:api)
//   - Node 18+
//
// Execution:
//   pnpm seed:additional:en
//

import pg from "pg";
import * as fs from "fs";
import * as path from "path";

// Parse .env manually
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    const val = parts
      .slice(1)
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    process.env[key] = val;
  }
}
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

const debatesData = [
  {
    thesis: "Remote work is more beneficial for companies than office work.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 7,
        content: "Companies can save significant amounts of money on office space, electricity, and office supplies.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 6,
        content: "Remote work opens up a global talent pool, allowing companies to hire the best specialists regardless of geographic location.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 5,
        content: "Team cohesion, spontaneous brainstorming, and company culture are harder to build and maintain when everyone is remote.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 5,
        content: "Onboarding junior employees is much more challenging and time-consuming without face-to-face mentorship.",
      },
      {
        key: "REBUT1",
        parent: "PRO1",
        side: "against",
        author: 4,
        votes: 4,
        content: "While office rental costs decrease, companies often face new costs in home-office stipends and cybersecurity infrastructure.",
      },
      {
        key: "REBUT2",
        parent: "CON1",
        side: "pro",
        author: 5,
        votes: 4,
        content: "Modern collaboration tools like Slack, Zoom, and Miro allow for efficient communication and structured brainstorming that can be even more productive than open-office interruptions.",
      },
    ],
  },
  {
    thesis: "Artificial intelligence will replace most software engineering jobs within ten years.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 6,
        content: "AI coding models are evolving exponentially, already capable of writing complex boilerplate, debugging, and generating entire functional apps from scratch.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 5,
        content: "Replacing human coders with AI will dramatically reduce development costs and speed up time-to-market for companies.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 7,
        content: "Software engineering is more about understanding business requirements, system architecture, and security design than just writing code.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 6,
        content: "AI-generated code still requires human oversight to fix subtle bugs, security vulnerabilities, and logic flaws.",
      },
    ],
  },
  {
    thesis: "Social media platforms do more harm than good to society.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 6,
        content: "Algorithmic feed designs maximize engagement by prioritizing sensationalist and divisive content, leading to political polarization.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 7,
        content: "Numerous studies link prolonged social media use to rising rates of anxiety, depression, and low self-esteem, especially among teenagers.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 5,
        content: "Social media has democratized information sharing and allowed marginalized groups to organize, build communities, and voice their struggles.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 4,
        content: "It enables small businesses to reach target audiences globally at a fraction of traditional advertising costs.",
      },
    ],
  },
  {
    thesis: "Cryptocurrency is the future of finance.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 5,
        content: "Decentralized ledgers remove the need for intermediary banks, reducing transaction fees and processing times for international transfers.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 4,
        content: "Cryptocurrencies offer financial services to billions of unbanked people worldwide who only have access to a mobile phone and the internet.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 7,
        content: "Extreme price volatility prevents cryptocurrencies from functioning as stable stores of value or reliable units of account.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 6,
        content: "The lack of centralized regulation makes consumers highly vulnerable to scams, market manipulation, and irreversible thefts.",
      },
    ],
  },
  {
    thesis: "Universal Basic Income (UBI) is necessary in the age of automation.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 7,
        content: "As AI and robotics automate routine manual and cognitive tasks, UBI provides a vital safety net for displaced workers.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 5,
        content: "UBI gives individuals the financial security to pursue education, creative endeavors, or start new entrepreneurial ventures.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 6,
        content: "Funding a nationwide UBI program would require massive tax increases, potentially stifling economic growth and investment.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 5,
        content: "Unconditional cash transfers could reduce work incentives, leading to labor shortages in critical service sectors.",
      },
    ],
  },
  {
    thesis: "Nuclear energy is essential for reaching net-zero carbon emissions.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 6,
        content: "Nuclear power plants produce massive amounts of clean, carbon-free electricity consistently, unlike weather-dependent wind and solar energy.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 5,
        content: "Modern reactor designs, including Small Modular Reactors (SMRs), are extremely safe, highly efficient, and produce very little waste.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 6,
        content: "The high initial capital cost and long construction timelines of nuclear plants make them slow and expensive to deploy.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 7,
        content: "Deep geological disposal for high-level radioactive waste remains a politically contentious and unresolved challenge in many countries.",
      },
    ],
  },
  {
    thesis: "Space exploration is a waste of resources that should be spent on Earth.",
    arguments: [
      {
        key: "PRO1",
        parent: null,
        side: "pro",
        author: 0,
        votes: 6,
        content: "The billions of dollars spent on space missions would be better utilized to address immediate crises on Earth, such as climate change and poverty.",
      },
      {
        key: "PRO2",
        parent: null,
        side: "pro",
        author: 1,
        votes: 5,
        content: "Living on Mars is an unrealistic goal; we should focus entirely on conserving and repairing our own habitable planet.",
      },
      {
        key: "CON1",
        parent: null,
        side: "against",
        author: 2,
        votes: 7,
        content: "Space exploration drives technological innovations that directly benefit Earth, including satellite communications, advanced water purification, and solar panels.",
      },
      {
        key: "CON2",
        parent: null,
        side: "against",
        author: 3,
        votes: 6,
        content: "Humanity needs a backup plan for long-term survival, and exploring space inspires the next generation of scientists and engineers.",
      },
    ],
  },
];

async function jsonFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `${opts.method ?? "GET"} ${path} → ${res.status}: ${text}`
    );
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function registerOrLogin(user) {
  try {
    return await jsonFetch("/auth/register", {
      method: "POST",
      body: { ...user, password: PASSWORD },
    });
  } catch (err) {
    if (err.status === 409) {
      return jsonFetch("/auth/login", {
        method: "POST",
        body: { email: user.email, password: PASSWORD },
      });
    }
    throw err;
  }
}

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

  console.log("👤  Creating/logging in debate author (Mark Demo)...");
  const ownerAuth = await registerOrLogin(owner);

  console.log(`👥  Registering/logging in ${voters.length} voters...`);
  const voterAuths = [];
  for (let i = 0; i < voters.length; i++) {
    voterAuths.push(await registerOrLogin(voters[i]));
    process.stdout.write(`    ${i + 1}/${voters.length}\r`);
  }
  console.log("\n");

  const createdDebateIds = [];

  for (let dIdx = 0; dIdx < debatesData.length; dIdx++) {
    const debateInfo = debatesData[dIdx];
    console.log(`💬  [${dIdx + 1}/${debatesData.length}] Creating public debate: "${debateInfo.thesis}"`);
    const debate = await jsonFetch("/debates", {
      method: "POST",
      token: ownerAuth.accessToken,
      body: {
        thesis: debateInfo.thesis,
        visibility: "public",
      },
    });
    createdDebateIds.push(debate.id);
    console.log(`    debate ID: ${debate.id}`);

    console.log(`🌳  Building argument tree...`);
    const createdArgs = {};

    for (const node of debateInfo.arguments) {
      const parentArgumentId = node.parent ? createdArgs[node.parent].id : null;
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
      createdArgs[node.key] = arg;

      const depth = node.parent ? 2 : 1;
      process.stdout.write(`      [L${depth}] ${node.key.padEnd(10)} ${node.side.toUpperCase()}\n`);
    }

    console.log(`🗳️   Casting votes...`);
    for (const node of debateInfo.arguments) {
      const arg = createdArgs[node.key];
      const idxs = [...Array(voterAuths.length).keys()]
        .sort(() => Math.random() - 0.5)
        .slice(0, node.votes);
      let cast = 0;
      for (const i of idxs) {
        const value = Math.random() > 0.25 ? 1 : -1;
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
    }
    console.log(`    Done with debate [${dIdx + 1}/${debatesData.length}]\n`);
  }

  const { Client } = pg;
  const dbUrl = process.env.DATABASE_URL;
  const watsonxKey = process.env.IBM_CLOUD_API_KEY;
  const watsonxProject = process.env.WATSONX_PROJECT_ID;
  const watsonxUrl = process.env.WATSONX_URL;

  if (dbUrl && watsonxKey && watsonxProject && watsonxUrl) {
    console.log(`🧩  Populating vectors (embeddings) for all new arguments...`);
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await new Promise((r) => setTimeout(r, 2000));

    const idsPlaceholder = createdDebateIds.map((_, i) => `$${i + 1}`).join(", ");
    const queryRes = await client.query(
      `SELECT id, content FROM arguments WHERE debate_id IN (${idsPlaceholder}) AND embedding IS NULL`,
      createdDebateIds
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
      console.log(`    Vectors populated (${successCount}/${queryRes.rows.length}).`);
    } else {
      console.log(`    All vectors generated by API in background.`);
    }
    await client.end();
  } else {
    console.log(`\n⚠️   Missing DATABASE_URL / IBM_CLOUD_API_KEY / WATSONX_PROJECT_ID / WATSONX_URL. Skipped vector generation.`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅  ALL DEBATES SEEDED SUCCESSFULLY!");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📍  Start exploring the feed here:`);
  console.log(`    ${WEB}/\n`);
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
