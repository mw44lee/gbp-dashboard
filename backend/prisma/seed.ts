// Seeds the DB from the real Samsung Experience Store dataset the user
// provided (backend/data/Samsung_Experience_Store_Global_Master_Dataset.xlsx,
// normalized by backend/data/convert_real_dataset.py into
// backend/data/gbp-urls.real.xlsx — the same column shape
// POST /api/import/gbp-urls expects).
//
// Two different kinds of data end up in the DB from two different sources:
//   REAL   (from the dataset): name, city/country, address, phone, rating,
//           review count, operating status, GBP + website URLs.
//   SIMULATED (derived here, deterministically): funnel activity numbers
//           (views/clicks/directions/calls/visit/purchase estimates) and
//           cover-photo age, because the GBP Performance/Insights API isn't
//           wired up yet (see the "Future Work" section of the project
//           plan) — real per-store activity data doesn't exist for us yet.
//   PLACEHOLDER (fabricated for the demo, clearly labeled): products and one
//           sample review per store, so the review-translation and AI-reply
//           features have something to show. These are NOT real customer
//           reviews — the source spreadsheet has no review text, only a
//           rating and a count.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { importGbpUrls } from "../src/services/excelImport.js";
import { prisma } from "../src/db/prismaClient.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// Deliberately generic, not tied to a specific model/year: the dataset has
// no product data at all, so naming a specific current model (e.g. "Galaxy
// S25 Ultra") would silently go stale the moment a new generation ships and
// would misrepresent this as real catalog data. Prices are illustrative USD
// reference points only — no real pricing or per-store lineup is modeled.
const PRODUCT_CATALOG = [
  { name: "Galaxy Flagship Smartphone", category: "Smartphone", price: 1300 },
  { name: "Galaxy Foldable Phone", category: "Smartphone", price: 1900 },
  { name: "Galaxy Watch", category: "Wearable", price: 350 },
  { name: "Galaxy Buds", category: "Audio", price: 250 },
  { name: "Galaxy Tablet", category: "Tablet", price: 800 },
  { name: "Neo QLED TV", category: "TV", price: 2500 },
];

const LANG_BY_COUNTRY: Record<string, string> = {
  KR: "ko", UK: "en", US: "en", CA: "en", FR: "fr", DE: "de", ES: "es", SG: "en", TH: "th", PH: "en",
};

const SAMPLE_REVIEW_TEXT: Record<string, { pos: string; neg: string }> = {
  ko: { pos: "친절한 직원분들 덕분에 즐거운 쇼핑이었습니다.", neg: "대기 시간이 너무 길어서 불편했습니다." },
  en: { pos: "Friendly staff made the visit a great experience.", neg: "The wait time was too long and it felt frustrating." },
  fr: { pos: "Le personnel était très accueillant, excellente expérience.", neg: "Le temps d'attente était trop long, expérience frustrante." },
  de: { pos: "Freundliches Personal, tolles Einkaufserlebnis.", neg: "Die Wartezeit war zu lang, das war frustrierend." },
  es: { pos: "El personal fue muy amable, una gran experiencia de compra.", neg: "El tiempo de espera fue demasiado largo, resultó frustrante." },
  th: { pos: "พนักงานเป็นมิตรมาก ประสบการณ์การช้อปปิ้งดีเยี่ยม", neg: "เวลารอนานเกินไป ทำให้รู้สึกไม่พอใจ" },
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

async function backfillSimulatedData() {
  const stores = await prisma.store.findMany({ include: { products: true } });

  for (const [index, store] of stores.entries()) {
    if (store.products.length > 0) continue; // already backfilled, keep idempotent

    const reviewCount = store.googleReviewCount ?? 50;
    const views = Math.max(500, reviewCount * 6);
    const websiteClicks = Math.round(views * 0.06);
    const directions = Math.round(views * 0.045);
    const calls = Math.round(views * 0.015);
    const conversionBoost = store.rating >= 4.2 ? 0.46 : store.rating >= 3.5 ? 0.38 : 0.27;
    const visitEst = Math.round(directions * conversionBoost);
    const purchaseEst = Math.round(visitEst * 0.4);
    const imgAgeDays = 5 + (hashString(store.gbpUrl) % 200);

    // 3 distinct catalog entries per store, starting at a store-specific
    // (hash-derived, so deterministic) offset rather than a fixed pairing —
    // gives real variety across 36 stores instead of a repeating 2-item cycle.
    const catalogOffset = hashString(store.gbpUrl) % PRODUCT_CATALOG.length;
    const products = [0, 1, 2].map((i) => PRODUCT_CATALOG[(catalogOffset + i) % PRODUCT_CATALOG.length]);

    const lang = LANG_BY_COUNTRY[store.countryCode ?? ""] ?? "en";
    const texts = SAMPLE_REVIEW_TEXT[lang] ?? SAMPLE_REVIEW_TEXT.en;
    const isPositive = store.rating >= 4.2;
    const reviewDate = new Date(Date.now() - (index % 20) * 86400000).toISOString().slice(0, 10);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        views,
        websiteClicks,
        directions,
        calls,
        visitEst,
        purchaseEst,
        ratingPrev: store.rating, // no historical snapshot available yet
        imgAgeDays,
        products: { create: products },
        reviews: {
          create: [
            {
              author: "Sample Reviewer", // placeholder — dataset has no review text, see file header
              stars: Math.min(5, Math.max(1, Math.round(store.rating))),
              originalText: isPositive ? texts.pos : texts.neg,
              originalLang: lang,
              date: reviewDate,
              sentiment: isPositive ? "pos" : "neg",
            },
          ],
        },
      },
    });
  }
}

async function main() {
  const file = path.join(here, "..", "data", "gbp-urls.real.xlsx");
  const buffer = readFileSync(file);
  const result = await importGbpUrls(buffer);
  console.log(`Imported real store data: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped.`);

  await backfillSimulatedData();
  console.log("Backfilled simulated funnel metrics + placeholder products/reviews where missing.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
