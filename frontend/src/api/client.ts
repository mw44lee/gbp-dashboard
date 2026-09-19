import type { Store, StoreDetail, Review } from "../types";

// Thin fetch wrapper. Every call goes through /api/... which Vite proxies to
// the Express backend in dev (vite.config.ts) — the browser never talks to
// the backend port directly, and never sees any API keys.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listStores: () => request<Store[]>("/api/stores"),
  getStore: (id: number) => request<StoreDetail>(`/api/stores/${id}`),
  getReviews: (storeId: number, lang?: string) =>
    request<Review[]>(`/api/stores/${storeId}/reviews${lang ? `?lang=${lang}` : ""}`),
  draftReply: (reviewId: number, targetLang: string) =>
    request<{ draft: string }>(`/api/reviews/${reviewId}/reply-draft`, {
      method: "POST",
      body: JSON.stringify({ targetLang }),
    }),
};
