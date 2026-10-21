// Usage: npm run report:ingest -w backend -- <path-to-email-body.txt> [subject]
// Reads a saved copy of the daily "[Samsung Experience Store]" email body and
// applies it to the database. Works with the web server stopped.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { ingestDailyReport } from "../src/services/reportIngest.js";
import { prisma } from "../src/db/prismaClient.js";

async function main() {
  const [file, subject] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: report:ingest <email-body.txt> [subject]");
    process.exit(1);
  }
  const result = await ingestDailyReport(readFileSync(file, "utf-8"), subject);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
