import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState } from "react";
import PerdeGecis from "../components/PerdeGecis";

const PerdeContext = createContext(null);

export function PerdeSaglayici({ children }) {
  const [perdeAktif, setPerdeAktif] = useState(false);
  const [perdeVaryant, setPerdeVaryant] = useState("normal");
  const [perdeAltMetni, setPerdeAltMetni] = useState("");
  const sonrakiIslemRef = useRef(null);
  const gecisSuruyorRef = useRef(false);

  const perdeIleGit = useCallback((islem, varyant = "normal", altMetin = "") => {
    if (gecisSuruyorRef.current) return;
    gecisSuruyorRef.current = true;
    sonrakiIslemRef.current = typeof islem === "function" ? islem : null;
    setPerdeVaryant(varyant === "kutlama" ? "kutlama" : "normal");
    setPerdeAltMetni(String(altMetin || ""));
    setPerdeAktif(true);
  }, []);

  const perdeKapandi = useCallback(() => {
    const sonrakiIslem = sonrakiIslemRef.current;
    sonrakiIslemRef.current = null;
    sonrakiIslem?.();
  }, []);

  const perdeTamamlandi = useCallback(() => {
    gecisSuruyorRef.current = false;
    setPerdeAktif(false);
    setPerdeAltMetni("");
  }, []);

  const deger = useMemo(() => ({ perdeAktif, perdeVaryant, perdeAltMetni, perdeIleGit, perdeTamamlandi }), [perdeAktif, perdeVaryant, perdeAltMetni, perdeIleGit, perdeTamamlandi]);

  return createElement(
    PerdeContext.Provider,
    { value: deger },
    children,
    createElement(PerdeGecis, {
      aktif: perdeAktif,
      varyant: perdeVaryant,
      altMetin: perdeAltMetni,
      onKapandi: perdeKapandi,
      onTamamlandi: perdeTamamlandi,
    }),
  );
}

export function usePerde() {
  const context = useContext(PerdeContext);
  if (!context) throw new Error("usePerde, PerdeSaglayici içinde kullanılmalıdır.");
  return context;
}
