import { useTranslation } from "react-i18next";
import type { Product } from "../types";

export function ProductList({ products }: { products: Product[] }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "ko" ? "ko-KR" : "en-US";

  // Display policy, not a data-fetch limit: a GBP listing itself only
  // surfaces its first couple of products prominently, so we show at most
  // the first two here regardless of how many the store record has —
  // this holds even once real per-store GBP product data replaces the
  // current placeholder catalog in prisma/seed.ts.
  const featured = products.slice(0, 2);

  return (
    <>
      <div className="sec-head" style={{ marginTop: 0 }}>
        <div className="label">{t("products.label")}</div>
      </div>
      <div className="products">
        {featured.map((p) => (
          <div className="product-chip" key={p.id}>
            <span className="pname">{p.name}</span>
            <span className="pprice">{p.price.toLocaleString(locale)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
