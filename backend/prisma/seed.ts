// Populates a fresh dev.db with dummy data, ported from the original
// single-file prototype's hardcoded `stores` array.
//
// This is intentionally separate from the /api/import/gbp-urls endpoint:
// that endpoint only ever receives the URL-list columns (store_name, region,
// country, gbp_url, category) that the future scraping agent will produce.
// The rest of a store's data (metrics, products, reviews) has no Excel
// source yet, so it lives here as local dev fixtures.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));

interface SeedReview {
  author: string;
  stars: number;
  date: string;
  originalLang: string;
  sentiment: string;
  originalText: string;
}
interface SeedProduct {
  name: string;
  category: string;
  price: number;
}
interface SeedStore {
  name: string;
  region: string;
  country: string;
  gbpUrl: string;
  category: string;
  views: number;
  websiteClicks: number;
  directions: number;
  calls: number;
  visitEst: number;
  purchaseEst: number;
  rating: number;
  ratingPrev: number;
  imgAgeDays: number;
  products: SeedProduct[];
  reviews: SeedReview[];
}

async function main() {
  const file = path.join(here, "..", "data", "seed-dummy.json");
  const { stores } = JSON.parse(readFileSync(file, "utf-8")) as { stores: SeedStore[] };

  for (const s of stores) {
    const { products, reviews, ...storeFields } = s;
    await prisma.store.upsert({
      where: { gbpUrl: s.gbpUrl },
      update: {},
      create: {
        ...storeFields,
        products: { create: products },
        reviews: { create: reviews },
      },
    });
  }

  console.log(`Seeded ${stores.length} stores.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
