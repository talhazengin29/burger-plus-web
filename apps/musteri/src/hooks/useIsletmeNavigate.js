import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsletme } from "../context/IsletmeContext";

export function useIsletmeNavigate() {
  const navigate = useNavigate();
  const { isletmeSlug } = useIsletme();
  return useCallback((hedef, secenekler) => {
    if (typeof hedef === "number") return navigate(hedef);
    const yol = String(hedef || "/");
    if (/^(https?:)?\/\//i.test(yol)) return window.location.assign(yol);
    const tenantKoku = `/${isletmeSlug}`;
    const tenantliYol = yol === "/" ? tenantKoku : `${tenantKoku}/${yol.replace(/^\/+/, "")}`;
    return navigate(tenantliYol, secenekler);
  }, [isletmeSlug, navigate]);
}
