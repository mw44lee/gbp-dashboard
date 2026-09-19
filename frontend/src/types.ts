// Mirrors the JSON shapes returned by the backend routes in
// backend/src/routes/*.ts. Kept as plain types (no codegen) since the API
// surface is small; if it grows, this is the first place worth replacing
// with a generated client from the Prisma schema / an OpenAPI spec.

export type Status = "healthy" | "warn" | "critical";

export interface Issue {
  level: "warn" | "critical";
  message: string;
}

export interface Store {
  id: number;
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
  issues: Issue[];
  status: Status;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
}

export interface Review {
  id: number;
  storeId: number;
  author: string;
  stars: number;
  originalText: string;
  originalLang: string;
  date: string;
  sentiment: "pos" | "neg";
  displayText?: string;
  displayLang?: string;
}

export interface StoreDetail extends Store {
  products: Product[];
  reviews: Review[];
}
