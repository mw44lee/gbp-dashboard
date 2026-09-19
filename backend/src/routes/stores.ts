import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import { computeIssues, computeStatus, StoreMetrics } from "../services/alerts.js";
import { aiProvider } from "../services/aiProvider.js";

export const storesRouter = Router();

function withStatus<T extends StoreMetrics>(store: T) {
  const issues = computeIssues(store);
  return { ...store, issues, status: computeStatus(issues) };
}

// GET /api/stores — board + alert feed + header stats all derive from this one list.
storesRouter.get("/", async (_req, res) => {
  const stores = await prisma.store.findMany({ orderBy: { id: "asc" } });
  res.json(stores.map(withStatus));
});

// GET /api/stores/:id — detail view: metrics + products + reviews (original text only).
storesRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const store = await prisma.store.findUnique({
    where: { id },
    include: { products: true, reviews: { orderBy: { id: "desc" } } },
  });
  if (!store) return res.status(404).json({ error: "Store not found" });
  res.json(withStatus(store));
});

// GET /api/stores/:id/reviews?lang=ko — reviews with text resolved into the requested
// language. Falls back to a cached AI translation, or calls the provider and caches it.
storesRouter.get("/:id/reviews", async (req, res) => {
  const storeId = Number(req.params.id);
  const lang = typeof req.query.lang === "string" ? req.query.lang : undefined;

  const reviews = await prisma.review.findMany({
    where: { storeId },
    orderBy: { id: "desc" },
    include: { translations: true },
  });

  const resolved = await Promise.all(
    reviews.map(async (r) => {
      if (!lang || lang === r.originalLang) {
        return { ...r, displayText: r.originalText, displayLang: r.originalLang, translations: undefined };
      }
      const cached = r.translations.find((t) => t.lang === lang);
      if (cached) {
        return { ...r, displayText: cached.text, displayLang: lang, translations: undefined };
      }
      const translated = await aiProvider.translateReview(r.originalText, lang);
      await prisma.reviewTranslation.create({ data: { reviewId: r.id, lang, text: translated } });
      return { ...r, displayText: translated, displayLang: lang, translations: undefined };
    })
  );

  res.json(resolved);
});
