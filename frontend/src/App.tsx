import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "./api/client";
import type { DailyReport, Store } from "./types";
import { Header } from "./components/Header";
import { DailyCheck } from "./components/DailyCheck";
import { AlertFeed } from "./components/AlertFeed";
import { StoreBoard } from "./components/StoreBoard";
import { StoreModal } from "./components/StoreModal";

export default function App() {
  const { t, i18n } = useTranslation();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);

  useEffect(() => {
    api.listStores().then((data) => {
      setStores(data);
      setLastSync(new Date());
    });
    // 404 just means no daily email has been ingested yet — hide the panel.
    api.latestReport().then(setReport).catch(() => setReport(null));
  }, []);

  const locale = i18n.resolvedLanguage === "ko" ? "ko-KR" : "en-US";

  return (
    <div className="wrap">
      <Header stores={stores} />

      {report && (
        <>
          <div className="sec-head">
            <div className="label">{t("daily.label")}</div>
            <div className="sub">{t("daily.sub")}</div>
          </div>
          <DailyCheck report={report} importedStores={stores.length} />
        </>
      )}

      <div className="sec-head">
        <div className="label">{t("alerts.label")}</div>
        <div className="sub">{t("alerts.sub")}</div>
      </div>
      <AlertFeed stores={stores} />

      <div className="sec-head">
        <div className="label">{t("board.label")}</div>
        <div className="sub">{t("board.sub")}</div>
      </div>
      <StoreBoard stores={stores} onSelect={setSelectedStoreId} />

      <footer>
        <span>{t("footer.tag")}</span>
        <span>
          {lastSync
            ? t("footer.lastSync", {
                time: lastSync.toLocaleString(locale, {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })
            : "-"}
        </span>
      </footer>

      {selectedStoreId !== null && (
        <StoreModal storeId={selectedStoreId} onClose={() => setSelectedStoreId(null)} />
      )}
    </div>
  );
}
