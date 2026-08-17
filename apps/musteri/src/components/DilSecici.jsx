import { useEffect, useRef, useState } from "react";
import { IconGlobe } from "./Icons";
import { useDil } from "../context/DilContext";
import "./DilSecici.css";

export default function DilSecici({ className = "" }) {
  const { dil, setDil, t } = useDil();
  const [acik, setAcik] = useState(false);
  const sarici = useRef(null);
  useEffect(() => {
    if (!acik) return undefined;
    const kapat = (e) => { if (!sarici.current?.contains(e.target)) setAcik(false); };
    document.addEventListener("pointerdown", kapat);
    return () => document.removeEventListener("pointerdown", kapat);
  }, [acik]);
  return <div ref={sarici} className={`dil-secici ${className}`}>
    <button type="button" className="dil-secici-tetik" aria-label={t("language.title", "Dil seç")} aria-expanded={acik} onClick={() => setAcik((onceki) => !onceki)}><IconGlobe /><b>{dil.toUpperCase()}</b></button>
    {acik && <div className="dil-secici-menu" role="menu">
      {[["tr", "language.tr", "Türkçe"], ["en", "language.en", "English"]].map(([kod, anahtar, ad]) => <button type="button" role="menuitemradio" aria-checked={dil === kod} className={dil === kod ? "aktif" : ""} key={kod} onClick={() => { setDil(kod); setAcik(false); }}><span>{kod.toUpperCase()}</span><b>{t(anahtar, ad)}</b><i>{dil === kod ? "✓" : ""}</i></button>)}
    </div>}
  </div>;
}
