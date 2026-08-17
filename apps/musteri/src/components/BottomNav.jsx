/* Alt navigasyon — 5 sekme. "Sipariş" şu an pasif (menü rafta).
   Menüyü eklerken sadece bu sekmenin `pasif` bayrağını kaldıracağız. */

import { NavLink } from "react-router-dom";
import { IconHome, IconTag, IconCutlery, IconStar, IconUser } from "./Icons";
import { useIsletme } from "../context/IsletmeContext";
import "./BottomNav.css";
import { useDil } from "../i18n/DilContext";

const sekmeler = [
  { yol: "/anasayfa", anahtar: "nav.home", Ikon: IconHome, pasif: false },
  { yol: "/kampanyalar", anahtar: "nav.campaigns", Ikon: IconTag, pasif: false },
  { yol: "/siparislerim", anahtar: "nav.orders", Ikon: IconCutlery, pasif: false },
  { yol: "/puanlarim", anahtar: "nav.rewards", Ikon: IconStar, pasif: false },
  { yol: "/profil", anahtar: "nav.profile", Ikon: IconUser, pasif: false },
];

export default function BottomNav() {
  const { isletmeSlug } = useIsletme();
  const { t } = useDil();
  return (
    <nav className="bottom-nav">
      {sekmeler.map(({ yol, anahtar, Ikon, pasif }) => {
        const etiket = t(anahtar);
        return (
        pasif ? (
          <span key={yol} className="nav-item nav-item--pasif" title="Yakında">
            <Ikon className="nav-icon" />
            <span className="nav-label">{etiket}</span>
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
            <span className="nav-label">{etiket}</span>
          </NavLink>
        ));
      })}
    </nav>
  );
}
