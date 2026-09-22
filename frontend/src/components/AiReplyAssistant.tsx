import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { Review } from "../types";

const REPLY_LANG_OPTIONS = ["en", "ko", "ja", "zh", "es", "vi", "fr", "de", "th"] as const;
const LABELS: Record<string, string> = {
  en: "English", ko: "한국어", ja: "日本語", zh: "中文", es: "Español", vi: "Tiếng Việt",
  fr: "Français", de: "Deutsch", th: "ไทย",
};

export function AiReplyAssistant({ review }: { review: Review | null }) {
  const { t, i18n } = useTranslation();
  const [targetLang, setTargetLang] = useState(i18n.resolvedLanguage ?? "en");
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function generate() {
    if (!review) return;
    setStatus("loading");
    try {
      const { draft } = await api.draftReply(review.id, targetLang);
      setDraft(draft);
      setStatus("idle");
    } catch (err) {
      setErrorMessage((err as Error).message);
      setStatus("error");
    }
  }

  return (
    <div className="assistant">
      <div className="sec-head" style={{ marginTop: 0 }}>
        <div className="label">{t("ai.label")}</div>
      </div>
      <div className="hint">{t("ai.hint")}</div>

      <div className="lang-row">
        <label htmlFor="reply-lang">{t("ai.replyLang")}</label>
        <select id="reply-lang" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
          {REPLY_LANG_OPTIONS.map((l) => (
            <option key={l} value={l}>{LABELS[l]}</option>
          ))}
        </select>
      </div>

      <button className="gen-btn" disabled={!review || status === "loading"} onClick={generate}>
        {status === "loading" ? t("ai.generating") : t("ai.generate")}
      </button>

      <div className={`ai-output ${!draft ? "empty" : ""}`}>
        {status === "error" ? t("ai.error", { message: errorMessage }) : draft ?? t("ai.empty")}
      </div>

      <div className="guideline-box">
        <b>{t("ai.guidelineTitle")}</b>
        <br />
        {(t("ai.guideline") as string).split("\n").map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </div>
    </div>
  );
}
