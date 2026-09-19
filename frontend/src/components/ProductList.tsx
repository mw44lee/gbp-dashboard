import { useTranslation } from "react-i18next";
import type { Product } from "../types";

export function ProductList({ products }: { products: Product[] }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "ko" ? "ko-KR" : "en-US";

  return (
    <>
      <div className="sec-head" style={{ marginTop: 0 }}>
        <div className="label">{t("products.label")}</div>
      </div>
      <div className="products">
        {products.map((p) => (
          <div className="product-chip" key={p.id}>
            <span className="pname">{p.name}</span>
            <span className="pprice">{p.price.toLocaleString(locale)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
