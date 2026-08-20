import { useDil } from "../dil/DilContext";
import "./DilSecici.css";

export default function DilSecici() {
  const { dil, dilDegistir, t } = useDil();
  return <div className="musteri-dil-secici" role="group" aria-label={t("language.label")}>
    <button type="button" className={dil === "tr" ? "aktif" : ""} aria-pressed={dil === "tr"} onClick={() => dilDegistir("tr")}>TR</button>
    <button type="button" className={dil === "en" ? "aktif" : ""} aria-pressed={dil === "en"} onClick={() => dilDegistir("en")}>EN</button>
  </div>;
}
