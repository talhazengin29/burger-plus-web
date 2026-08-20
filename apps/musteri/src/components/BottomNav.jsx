/* Alt navigasyon — 5 sekme. "Sipariş" şu an pasif (menü rafta).
   Menüyü eklerken sadece bu sekmenin `pasif` bayrağını kaldıracağız. */

import { NavLink } from "react-router-dom";
import { IconHome, IconTag, IconCutlery, IconStar, IconUser } from "./Icons";
import { useIsletme } from "../context/IsletmeContext";
import { useDil } from "../dil/DilContext";
import "./BottomNav.css";

const sekmeler = [
  { yol: "/anasayfa", etiket: "nav.home", Ikon: IconHome, pasif: false },
  { yol: "/kampanyalar", etiket: "nav.campaigns", Ikon: IconTag, pasif: false },
  { yol: "/siparislerim", etiket: "nav.orders", Ikon: IconCutlery, pasif: false },
  { yol: "/puanlarim", etiket: "nav.points", Ikon: IconStar, pasif: false },
  { yol: "/profil", etiket: "nav.profile", Ikon: IconUser, pasif: false },
];

export default function BottomNav() {
  const { t } = useDil();
  const { isletmeSlug } = useIsletme();
  return (
    <nav className="bottom-nav">
      {sekmeler.map(({ yol, etiket, Ikon, pasif }) =>
        pasif ? (
          <span key={yol} className="nav-item nav-item--pasif" title={t("nav.soon")}>
            <Ikon className="nav-icon" />
            <span className="nav-label">{t(etiket)}</span>
          </span>
        ) : (
          <NavLink
            key={yol}
            to={`/${isletmeSlug}${yol}`}
            className={({ isActive }) =>
              "nav-item" + (isActive ? " nav-item--aktif" : "")
            }
          >
            <span className="nav-icon-wrap">
              <Ikon className="nav-icon" />
            </span>
            <span className="nav-label">{t(etiket)}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}
