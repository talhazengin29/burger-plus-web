import { useDil } from "../i18n/DilContext";
import "./DilSecici.css";

export default function DilSecici({ kompakt = false }) {
  const { dil, diliAyarla, diller, t } = useDil();
  if (diller.length < 2) return null;
  return (
    <label className={`dil-secici${kompakt ? " dil-secici--kompakt" : ""}`}>
      <span aria-hidden="true">◎</span>
      <span className="sr-only">{t("language.select")}</span>
      <select value={dil} onChange={(e) => diliAyarla(e.target.value)} aria-label={t("language.select")}>
        {diller.map((kod) => <option key={kod} value={kod}>{kod.toUpperCase()}</option>)}
      </select>
    </label>
  );
}
