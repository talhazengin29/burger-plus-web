/* Alt navigasyon — 5 sekme. "Sipariş" şu an pasif (menü rafta).
   Menüyü eklerken sadece bu sekmenin `pasif` bayrağını kaldıracağız. */

import { NavLink } from "react-router-dom";
import { IconHome, IconTag, IconCutlery, IconStar, IconUser } from "./Icons";
import { useIsletme } from "../context/IsletmeContext";
import { useDil } from "../context/DilContext";
import "./BottomNav.css";

const sekmeler = [
  { yol: "/anasayfa", anahtar: "nav.home", etiket: "Ana Sayfa", Ikon: IconHome, pasif: false },
  { yol: "/kampanyalar", anahtar: "nav.campaigns", etiket: "Kampanyalar", Ikon: IconTag, pasif: false },
  { yol: "/siparislerim", anahtar: "nav.orders", etiket: "Sipariş", Ikon: IconCutlery, pasif: false },
  { yol: "/puanlarim", anahtar: "nav.points", etiket: "Puanlarım", Ikon: IconStar, pasif: false },
  { yol: "/profil", anahtar: "nav.profile", etiket: "Profil", Ikon: IconUser, pasif: false },
];

export default function BottomNav() {
  const { isletmeSlug } = useIsletme();
  const { t } = useDil();
  return (
    <nav className="bottom-nav">
      {sekmeler.map(({ yol, anahtar, etiket, Ikon, pasif }) =>
        pasif ? (
          <span key={yol} className="nav-item nav-item--pasif" title="Yakında">
            <Ikon className="nav-icon" />
            <span className="nav-label">{t(anahtar, etiket)}</span>
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
            <span className="nav-label">{t(anahtar, etiket)}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}
