import { useEffect, useState } from "react";
import { useTema } from "../context/TemaContext";

export default function MarkaLogosu({ className = "", alt = "" }) {
  const { logoUrl, isletmeAdi } = useTema();
  const [logoHatasi, setLogoHatasi] = useState(false);

  useEffect(() => setLogoHatasi(false), [logoUrl]);

  if (logoUrl && !logoHatasi) {
    return <img className={`${className} marka-logo-yuklu`.trim()} src={logoUrl} alt={alt || isletmeAdi} onError={() => setLogoHatasi(true)} />;
  }
  return <span className={`${className} marka-logo-metin`.trim()}>{isletmeAdi}</span>;
}
