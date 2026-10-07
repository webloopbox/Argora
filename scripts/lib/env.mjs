import * as fs from "fs";
import * as path from "path";

// Minimal .env reader. The scripts run as bare Node (no bundler, no dotenv
// dependency), so the file is parsed by hand: a line is `KEY=value`, `#`
// starts a comment, surrounding quotes are stripped, and a value may itself
// contain `=` (API keys do).
export function loadEnv(file = ".env") {
  const envPath = path.resolve(file);
  if (!fs.existsSync(envPath)) return;

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
