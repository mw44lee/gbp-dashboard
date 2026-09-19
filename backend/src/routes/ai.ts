import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import { aiProvider } from "../services/aiProvider.js";

export const aiRouter = Router();

// POST /api/reviews/:id/reply-draft  { targetLang: "en" }  -> { draft: string }
aiRouter.post("/reviews/:id/reply-draft", async (req, res) => {
  const id = Number(req.params.id);
  const targetLang = typeof req.body?.targetLang === "string" ? req.body.targetLang : "en";

  const review = await prisma.review.findUnique({ where: { id }, include: { store: true } });
  if (!review) return res.status(404).json({ error: "Review not found" });

  try {
    const draft = await aiProvider.draftReply(
      { storeName: review.store.name, stars: review.stars, text: review.originalText },
      targetLang
    );
    res.json({ draft });
  } catch (err) {
    res.status(502).json({ error: `AI provider call failed: ${(err as Error).message}` });
  }
});
