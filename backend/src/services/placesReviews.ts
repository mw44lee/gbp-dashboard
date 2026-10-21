// Pulls real Google reviews for every store from the Places API (New) and
// replaces the seeded placeholder reviews.
//
// Limits to know: the API returns at most 5 reviews per place (Google's
// choice of recent/relevant), not the full history; requesting the `reviews`
// field is billed at a higher Places SKU tier than basic fields. The full
// history needs the Business Profile API (owner OAuth) instead.

import { prisma } from "../db/prismaClient.js";

interface LocalizedText {
  text?: string;
  languageCode?: string;
}

export interface PlacesReview {
  name: string;
  rating?: number;
  publishTime?: string;
  text?: LocalizedText;
  originalText?: LocalizedText;
  authorAttribution?: { displayName?: string };
}

export interface MappedReview {
  externalId: string;
  author: string;
  stars: number;
  originalText: string;
  originalLang: string;
  date: string;
  sentiment: "pos" | "neg";
}

export function placeIdFromUrl(url: string): string | null {
  return url.match(/place_id:([\w-]+)/)?.[1] ?? null;
}

// Prefer originalText: it is what the reviewer actually wrote, in their own
// language. `text` is Google's translation into the request language.
export function mapPlacesReview(r: PlacesReview): MappedReview | null {
  const body = r.originalText?.text ?? r.text?.text;
  if (!r.name || !body || r.rating === undefined) return null; // rating-only reviews have nothing to show or translate
  const stars = Math.min(5, Math.max(1, Math.round(r.rating)));
  return {
    externalId: r.name,
    author: r.authorAttribution?.displayName ?? "Google user",
    stars,
    originalText: body,
    originalLang: (r.originalText?.languageCode ?? r.text?.languageCode ?? "en").split("-")[0],
    date: r.publishTime ? r.publishTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
    sentiment: stars >= 4 ? "pos" : "neg",
  };
}

export interface SyncResult {
  storesSynced: number;
  reviewsUpserted: number;
  placeholdersRemoved: number;
  errors: { store: string; error: string }[];
}

export async function syncPlacesReviews(apiKey: string): Promise<SyncResult> {
  const result: SyncResult = { storesSynced: 0, reviewsUpserted: 0, placeholdersRemoved: 0, errors: [] };
  const stores = await prisma.store.findMany({ orderBy: { id: "asc" } });

  for (const store of stores) {
    const placeId = placeIdFromUrl(store.gbpUrl);
    if (!placeId) {
      result.errors.push({ store: store.name, error: "no place_id in gbpUrl" });
      continue;
    }

    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "reviews" },
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 200);
      result.errors.push({ store: store.name, error: `HTTP ${res.status}: ${detail}` });
      // A rejected key fails every store the same way — stop instead of making 58 doomed calls.
      if (res.status === 401 || res.status === 403) break;
      continue;
    }

    const body = (await res.json()) as { reviews?: PlacesReview[] };
    const mapped = (body.reviews ?? []).map(mapPlacesReview).filter((r): r is MappedReview => r !== null);

    for (const r of mapped) {
      const { externalId, ...fields } = r;
      await prisma.review.upsert({
        where: { externalId },
        update: fields,
        create: { storeId: store.id, externalId, ...fields },
      });
    }
    result.reviewsUpserted += mapped.length;

    const removed = await prisma.review.deleteMany({ where: { storeId: store.id, externalId: null } });
    result.placeholdersRemoved += removed.count;
    result.storesSynced += 1;
  }

  return result;
}
