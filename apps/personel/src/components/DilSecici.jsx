import { useTranslation } from "react-i18next";
import "./DilSecici.css";

export default function DilSecici({ sade = false }) {
  const { i18n, t } = useTranslation();
  const dil = i18n.resolvedLanguage || "tr";

  return (
    <label className={`dil-secici ${sade ? "dil-secici--sade" : ""}`}>
      <span className="dil-secici-ikon" aria-hidden="true">文</span>
      <span className="dil-secici-etiket">{t("language.label")}</span>
      <select value={dil} onChange={(event) => i18n.changeLanguage(event.target.value)} aria-label={t("language.label")}>
        <option value="tr">{t("language.turkish")}</option>
        <option value="en">{t("language.english")}</option>
      </select>
    </label>
  );
}
