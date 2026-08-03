import { useEffect, useState } from "react";
import { useTema } from "../context/TemaContext";
import burgerPlusLogosu from "../assets/logo-full-transparent.png";

export default function MarkaLogosu({ className = "", alt = "" }) {
  const { logoUrl, isletmeAdi, isletmeSlug } = useTema();
  const [logoHatasi, setLogoHatasi] = useState(false);
  const gosterilecekLogo = logoUrl || (isletmeSlug === "burger-plus" ? burgerPlusLogosu : "");

  useEffect(() => setLogoHatasi(false), [gosterilecekLogo]);

  if (gosterilecekLogo && !logoHatasi) {
    const logoSinifi = logoUrl ? "marka-logo-ozel" : "marka-logo-varsayilan";
    return <img className={`${className} marka-logo-yuklu ${logoSinifi}`.trim()} src={gosterilecekLogo} alt={alt || isletmeAdi} onError={() => setLogoHatasi(true)} />;
  }
  return <span className={`${className} marka-logo-metin`.trim()}>{isletmeAdi}</span>;
}
