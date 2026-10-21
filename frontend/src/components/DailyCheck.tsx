import { useTranslation } from "react-i18next";
import type { DailyReport } from "../types";

// Fleet-wide snapshot from the daily "[Samsung Experience Store]" email.
// Shown separately from the board on purpose: the report covers every store
// the checker knows about, which can be more than the stores imported here.
export function DailyCheck({ report, importedStores }: { report: DailyReport; importedStores: number }) {
  const { t } = useTranslation();
  const activePct = report.totalStores ? ((report.activeCount / report.totalStores) * 100).toFixed(1) : "-";

  return (
    <section className="daily-check">
      <div className="daily-main">
        <div className="daily-big">
          {report.activeCount}
          <span className="daily-of"> / {report.totalStores}</span>
        </div>
        <div>
          <div className="daily-title">{t("daily.activeStores", { pct: activePct })}</div>
          <div className="daily-sub">
            {t("daily.asOf", { date: report.reportDate, countries: report.totalCountries })} · {report.changeNote}
          </div>
          <div className="daily-sub">
            {t("daily.tempClosed", { count: report.tempClosedCount })} · {t("daily.permClosed", { count: report.permClosedCount })}
          </div>
        </div>
      </div>

      <div className="daily-regions">
        {report.regions.map((r) => (
          <span key={r.name} className={`region-chip ${r.normal < r.total ? "warn" : ""}`}>
            {r.name} <b>{r.normal}/{r.total}</b>
          </span>
        ))}
      </div>

      {importedStores < report.totalStores && (
        <div className="daily-note">
          {t("daily.importGap", { imported: importedStores, total: report.totalStores })}
        </div>
      )}
    </section>
  );
}
