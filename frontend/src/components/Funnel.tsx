import { useTranslation } from "react-i18next";
import type { Store } from "../types";

export function Funnel({ store }: { store: Store }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "ko" ? "ko-KR" : "en-US";
  const maxV = store.views;

  const stages = [
    { label: t("funnel.views"), val: store.views, color: "var(--blue)" },
    { label: t("funnel.actions"), val: store.websiteClicks + store.directions + store.calls, color: "var(--amber)" },
    { label: t("funnel.visit"), val: store.visitEst, color: "#8DD9C0" },
    { label: t("funnel.purchase"), val: store.purchaseEst, color: "var(--teal)" },
  ];

  return (
    <>
      <div className="sec-head" style={{ marginTop: 0 }}>
        <div className="label">{t("funnel.label")}</div>
        <div className="sub">{t("funnel.sub")}</div>
      </div>
      <div className="funnel">
        {stages.map((st) => (
          <div className="funnel-row" key={st.label}>
            <div className="flabel">{st.label}</div>
            <div className="funnel-bar-track">
              <div
                className="funnel-bar"
                style={{ width: `${Math.max(4, (st.val / maxV) * 100)}%`, background: st.color }}
              />
            </div>
            <div className="fval">{st.val.toLocaleString(locale)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
