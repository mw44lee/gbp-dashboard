// Usage: npm run reviews:sync -w backend
// Needs GOOGLE_PLACES_API_KEY in backend/.env (never commit it).

import "dotenv/config";
import { syncPlacesReviews } from "../src/services/placesReviews.js";
import { prisma } from "../src/db/prismaClient.js";

async function main() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.error("GOOGLE_PLACES_API_KEY is not set in backend/.env — nothing was changed.");
    process.exit(1);
  }
  console.log(JSON.stringify(await syncPlacesReviews(key), null, 2));
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
