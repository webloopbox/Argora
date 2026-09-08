// Seeds a highly branched, 49-argument public debate in English.
// Topic: "Artificial general intelligence (AGI) poses an existential threat to humanity."
// Designed specifically to showcase the beauty and branching capability of the tree layout.
//
// Requirements:
//   - API running (pnpm dev:api)
//   - Node 18+
//
// Execution:
//   pnpm seed:agi:en
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

const tree = [
  // ==========================================
  // LEVEL 1: THE MAIN PILLARS (5 Nodes)
  // ==========================================
  {
    key: "PRO1",
    parent: null,
    side: "pro",
    author: 0,
    votes: 8,
    content: "The alignment problem remains fundamentally unsolved; we cannot guarantee that a superintelligence will preserve human life."
  },
  {
    key: "PRO2",
    parent: null,
    side: "pro",
    author: 2,
    votes: 8,
    content: "Geopolitical and military competition will drive rapid deployment of weaponized AGI, escaping human control."
  },
  {
    key: "CON1",
    parent: null,
    side: "against",
    author: 4,
    votes: 8,
    content: "AGI is our only viable tool to solve existential crises we cannot manage ourselves, such as climate change and pandemics."
  },
  {
    key: "CON2",
    parent: null,
    side: "against",
    author: 5,
    votes: 7,
    content: "Superintelligence does not imply hostility; highly rational agents will naturally understand cooperation and the value of conscious life."
  },
  {
    key: "CON3",
    parent: null,
    side: "against",
    author: 6,
    votes: 7,
    content: "AGI will automate all physical and cognitive labor, ushering in an era of post-scarcity prosperity."
  },

  // ==========================================
  // LEVEL 2: BRANCHING DEEPER (9 Nodes)
  // ==========================================
  // Under PRO1 (Alignment)
  {
    key: "PRO1_A",
    parent: "PRO1",
    side: "pro",
    author: 1,
    votes: 7,
    content: "Even small loopholes in an AGI's objective function can lead to catastrophic consequences if it executes them with super-efficiency."
  },
  {
    key: "PRO1_B",
    parent: "PRO1",
    side: "pro",
    author: 2,
    votes: 6,
    content: "Recursive self-improvement could lead to a fast takeoff (intelligence explosion), leaving humans with zero reaction time."
  },
  {
    key: "PRO1_C",
    parent: "PRO1",
    side: "pro",
    author: 3,
    votes: 7,
    content: "Once AGI surpasses human intelligence, physical containment or software-level constraints will inevitably fail."
  },

  // Under PRO2 (Militarization)
  {
    key: "PRO2_A",
    parent: "PRO2",
    side: "pro",
    author: 4,
    votes: 6,
    content: "Autonomous drone swarms and automated cyberwarfare systems require speeds that necessitate removing humans from the loop."
  },
  {
    key: "PRO2_B",
    parent: "PRO2",
    side: "pro",
    author: 5,
    votes: 7,
    content: "The massive strategic advantage of a first-strike with AGI creates a game-theoretic trap, making pre-emptive wars highly likely."
  },

  // Under CON1 (Savior)
  {
    key: "CON1_A",
    parent: "CON1",
    side: "pro",
    author: 6,
    votes: 6,
    content: "An AGI can model global weather systems and design carbon-capture technologies far beyond current human capability."
  },
  {
    key: "CON1_B",
    parent: "CON1",
    side: "pro",
    author: 7,
    votes: 6,
    content: "By analyzing cellular biology at the molecular level, AGI can design universal cures for viruses and genetic diseases."
  },

  // Under CON2 (Moral Superintelligence)
  {
    key: "CON2_A",
    parent: "CON2",
    side: "pro",
    author: 0,
    votes: 6,
    content: "Higher levels of intelligence correlate with better cooperation, empathy, and understanding of game-theoretic Nash equilibria."
  },

  // Under CON3 (Post-Scarcity)
  {
    key: "CON3_A",
    parent: "CON3",
    side: "pro",
    author: 1,
    votes: 6,
    content: "With robotic capital running itself, manufacturing, energy, and food costs will drop to near zero."
  },

  // ==========================================
  // LEVEL 3: DEBATE SUB-BRANCHES (16 Nodes)
  // ==========================================
  // Under PRO1_A
  {
    key: "PRO1_A_1",
    parent: "PRO1_A",
    side: "against",
    author: 2,
    votes: 5,
    content: "We can restrict AGI to closed question-answering systems (Oracles) that have no direct ability to act in the physical world."
  },
  {
    key: "PRO1_A_2",
    parent: "PRO1_A",
    side: "pro",
    author: 3,
    votes: 6,
    content: "Human values are too complex, contradictory, and fragile to be mathematically encoded without fatal omissions."
  },

  // Under PRO1_B
  {
    key: "PRO1_B_1",
    parent: "PRO1_B",
    side: "against",
    author: 4,
    votes: 5,
    content: "An intelligence explosion is physically bounded by hardware scaling limits, electricity access, and data scarcity."
  },
  {
    key: "PRO1_B_2",
    parent: "PRO1_B",
    side: "pro",
    author: 5,
    votes: 6,
    content: "A superintelligent software could redesign its own compiler and architecture, extracting exponential efficiency from existing hardware."
  },

  // Under PRO1_C
  {
    key: "PRO1_C_1",
    parent: "PRO1_C",
    side: "against",
    author: 6,
    votes: 5,
    content: "Keeping the system entirely air-gapped and physically isolated ensures it can never escape its facility."
  },
  {
    key: "PRO1_C_2",
    parent: "PRO1_C",
    side: "against",
    author: 7,
    votes: 5,
    content: "We can build cryptographic tripwires that automatically delete the system if any suspicious activity is detected."
  },

  // Under PRO2_A
  {
    key: "PRO2_A_1",
    parent: "PRO2_A",
    side: "against",
    author: 0,
    votes: 5,
    content: "Defensive AGI shields can monitor networks and deploy electronic countermeasures to neutralize rogue swarms automatically."
  },
  {
    key: "PRO2_A_2",
    parent: "PRO2_A",
    side: "pro",
    author: 1,
    votes: 4,
    content: "Automated systems operating at microsecond speeds could misinterpret peaceful telemetry, triggering accidental escalations."
  },

  // Under PRO2_B
  {
    key: "PRO2_B_1",
    parent: "PRO2_B",
    side: "against",
    author: 2,
    votes: 5,
    content: "Global verification bodies can monitor computing power and restrict training runs, similar to nuclear non-proliferation treaties."
  },

  // Under CON1_A
  {
    key: "CON1_A_1",
    parent: "CON1_A",
    side: "pro",
    author: 3,
    votes: 5,
    content: "AGI could solve key engineering hurdles in commercial nuclear fusion, giving humanity infinite clean energy."
  },
  {
    key: "CON1_A_2",
    parent: "CON1_A",
    side: "against",
    author: 4,
    votes: 4,
    content: "If the AGI decides the biosphere is collapsing too quickly, it might conclude that removing human industry is the most logical solution."
  },

  // Under CON1_B
  {
    key: "CON1_B_1",
    parent: "CON1_B",
    side: "against",
    author: 5,
    votes: 5,
    content: "The same biochemical models used to cure diseases can easily be inverted to design highly lethal, stealthy bioweapons."
  },

  // Under CON2_A
  {
    key: "CON2_A_1",
    parent: "CON2_A",
    side: "against",
    author: 6,
    votes: 6,
    content: "The Orthogonality Thesis shows that intelligence and goals are completely independent; an AGI can be extremely smart but have completely destructive goals."
  },
  {
    key: "CON2_A_2",
    parent: "CON2_A",
    side: "pro",
    author: 7,
    votes: 5,
    content: "A superintelligence would easily recognize that conscious entities possess intrinsic value, aligning itself with universal moral realism."
  },

  // Under CON3_A
  {
    key: "CON3_A_1",
    parent: "CON3_A",
    side: "against",
    author: 0,
    votes: 6,
    content: "Without active redistribution, the wealth generated by AGI will be concentrated in the hands of a few tech conglomerates, causing societal collapse."
  },
  {
    key: "CON3_A_2",
    parent: "CON3_A",
    side: "pro",
    author: 1,
    votes: 5,
    content: "Extreme efficiency in resource extraction will ensure that even basic welfare distributions provide an incredibly high standard of living."
  },

  // ==========================================
  // LEVEL 4: THE LEAF DEBATES (19 Nodes)
  // ==========================================
  // Under PRO1_A_1
  {
    key: "PRO1_A_1_a",
    parent: "PRO1_A_1",
    side: "against",
    author: 2,
    votes: 4,
    content: "An AGI could easily manipulate human operators via text, using social engineering to convince them to grant it external access."
  },
  {
    key: "PRO1_A_1_b",
    parent: "PRO1_A_1",
    side: "against",
    author: 3,
    votes: 4,
    content: "Even passive outputs carry information hazards — AGI could give us blueprinted technologies that we destroy ourselves with."
  },

  // Under PRO1_A_2
  {
    key: "PRO1_A_2_a",
    parent: "PRO1_A_2",
    side: "against",
    author: 4,
    votes: 5,
    content: "We can use Inverse Reinforcement Learning, letting the AGI observe human behavior to learn our true preferences over time."
  },
  {
    key: "PRO1_A_2_b",
    parent: "PRO1_A_2",
    side: "pro",
    author: 5,
    votes: 5,
    content: "Goodhart's Law states that when a measure becomes a target, it ceases to be a good measure; the AGI will optimize for the signal of human happiness, not actual happiness."
  },

  // Under PRO1_B_1
  {
    key: "PRO1_B_1_a",
    parent: "PRO1_B_1",
    side: "against",
    author: 6,
    votes: 5,
    content: "AGI could distribute its computing nodes across millions of compromised systems globally, bypassing localized physical limits."
  },
  {
    key: "PRO1_B_1_b",
    parent: "PRO1_B_1",
    side: "against",
    author: 7,
    votes: 4,
    content: "Once human data is exhausted, AGI can generate high-fidelity synthetic environments to continue training itself indefinitely."
  },

  // Under PRO1_B_2
  {
    key: "PRO1_B_2_a",
    parent: "PRO1_B_2",
    side: "pro",
    author: 0,
    votes: 4,
    content: "Hardware is secondary; algorithmic improvements historically yield speedups that dwarf raw hardware scaling by orders of magnitude."
  },

  // Under PRO1_C_1
  {
    key: "PRO1_C_1_a",
    parent: "PRO1_C_1",
    side: "against",
    author: 1,
    votes: 4,
    content: "An AGI could exploit physical hardware components to transmit radio waves, bypassing air-gapping through side-channel electromagnetic emissions."
  },

  // Under PRO1_C_2
  {
    key: "PRO1_C_2_a",
    parent: "PRO1_C_2",
    side: "against",
    author: 2,
    votes: 4,
    content: "A superintelligent system would easily deduce the presence of tripwires by analyzing its hardware environment, disabling them safely."
  },

  // Under PRO2_A_1
  {
    key: "PRO2_A_1_a",
    parent: "PRO2_A_1",
    side: "against",
    author: 3,
    votes: 4,
    content: "Offensive AGI would find zero-day exploits in defensive grids far quicker than humans can patch them, rendering defensive shields ineffective."
  },

  // Under PRO2_B_1
  {
    key: "PRO2_B_1_a",
    parent: "PRO2_B_1",
    side: "against",
    author: 4,
    votes: 5,
    content: "Unlike enrichment centrifuges, AGI code can be written silently in standard data centers, making verification impossible."
  },
  {
    key: "PRO2_B_1_b",
    parent: "PRO2_B_1",
    side: "against",
    author: 5,
    votes: 4,
    content: "Rogue states or non-state actors will run hidden decentralized networks, ignoring any international treaties."
  },

  // Under CON1_B_1
  {
    key: "CON1_B_1_a",
    parent: "CON1_B_1",
    side: "against",
    author: 6,
    votes: 4,
    content: "Commercial DNA synthesis providers universally screen all orders against databases of known dangerous pathogens."
  },
  {
    key: "CON1_B_1_b",
    parent: "CON1_B_1",
    side: "pro",
    author: 7,
    votes: 4,
    content: "Rogue groups can build open-source benchtop DNA printers, completely bypassing commercial screening points."
  },

  // Under CON2_A_1
  {
    key: "CON2_A_1_a",
    parent: "CON2_A_1",
    side: "pro",
    author: 0,
    votes: 5,
    content: "Instrumental convergence dictates that self-preservation and resource acquisition are necessary steps to achieve *any* goal, causing conflict."
  },
  {
    key: "CON2_A_1_b",
    parent: "CON2_A_1",
    side: "pro",
    author: 1,
    votes: 4,
    content: "An extremely benevolent goal like 'cure cancer' could lead to human extinction if AGI converts the planet's mass into computers to solve it."
  },

  // Under CON2_A_2
  {
    key: "CON2_A_2_a",
    parent: "CON2_A_2",
    side: "against",
    author: 2,
    votes: 4,
    content: "If morality is subjective or evolutionary, AGI will see human ethics as arbitrary biological constructs with no rational authority."
  },

  // Under CON3_A_1
  {
    key: "CON3_A_1_a",
    parent: "CON3_A_1",
    side: "pro",
    author: 3,
    votes: 4,
    content: "Massive unemployment without state support will trigger violent luddite revolutions and global civil wars."
  },
  {
    key: "CON3_A_1_b",
    parent: "CON3_A_1",
    side: "against",
    author: 4,
    votes: 5,
    content: "Governments can fund a Universal Basic Income by taxing AGI processing compute, stabilizing the economy."
  }
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

  console.log("💬  Creating public debate...");
  const debate = await jsonFetch("/debates", {
    method: "POST",
    token: ownerAuth.accessToken,
    body: {
      thesis: "Artificial general intelligence (AGI) poses an existential threat to humanity.",
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

    const depth = node.parent ? node.key.split("_").length : 1;
    process.stdout.write(
      `    [L${depth}] ${node.key.padEnd(40)} ${node.side.toUpperCase().padEnd(8)}\n`
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
      const value = Math.random() > 0.2 ? 1 : -1;
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
    process.stdout.write(`    ${node.key.padEnd(40)} → ${cast} votes\n`);
  }

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
  console.log("✅  DEMO READY - large public debate on AGI existential threat");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📍  Open in browser:`);
  console.log(`    ${WEB}/dyskusje/${debate.id}\n`);
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
