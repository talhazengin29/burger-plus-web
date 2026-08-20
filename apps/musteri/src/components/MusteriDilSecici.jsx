import { useTranslation } from "react-i18next";
import "./MusteriDilSecici.css";

export default function MusteriDilSecici() {
  const { i18n, t } = useTranslation();
  const aktifDil = i18n.resolvedLanguage || "tr";
  return (
    <div className="musteri-dil-secici" role="group" aria-label={t("language.label")}>
      <button type="button" className={aktifDil === "tr" ? "aktif" : ""} onClick={() => i18n.changeLanguage("tr")} aria-pressed={aktifDil === "tr"}>TR</button>
      <button type="button" className={aktifDil === "en" ? "aktif" : ""} onClick={() => i18n.changeLanguage("en")} aria-pressed={aktifDil === "en"}>EN</button>
    </div>
  );
}
