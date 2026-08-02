import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsletme } from "../context/IsletmeContext";

export function useIsletmeNavigate() {
  const navigate = useNavigate();
  const { isletmeSlug } = useIsletme();
  return useCallback((hedef, secenekler) => {
    if (typeof hedef === "number") return navigate(hedef);
    const yol = String(hedef || "/");
    return navigate(yol === "/" ? `/${isletmeSlug}` : `/${isletmeSlug}/${yol.replace(/^\/+/, "")}`, secenekler);
  }, [isletmeSlug, navigate]);
}
