/* Alt navigasyon — 5 sekme. "Sipariş" şu an pasif (menü rafta).
   Menüyü eklerken sadece bu sekmenin `pasif` bayrağını kaldıracağız. */

import { NavLink } from "react-router-dom";
import { IconHome, IconTag, IconCutlery, IconStar, IconUser } from "./Icons";
import "./BottomNav.css";

const sekmeler = [
  { yol: "/anasayfa", etiket: "Ana Sayfa", Ikon: IconHome, pasif: false },
  { yol: "/kampanyalar", etiket: "Kampanyalar", Ikon: IconTag, pasif: false },
  { yol: "/siparislerim", etiket: "Sipariş", Ikon: IconCutlery, pasif: false },
  { yol: "/puanlarim", etiket: "Puanlarım", Ikon: IconStar, pasif: false },
  { yol: "/profil", etiket: "Profil", Ikon: IconUser, pasif: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {sekmeler.map(({ yol, etiket, Ikon, pasif }) =>
        pasif ? (
          <span key={yol} className="nav-item nav-item--pasif" title="Yakında">
            <Ikon className="nav-icon" />
            <span className="nav-label">{etiket}</span>
          </span>
        ) : (
          <NavLink
            key={yol}
            to={yol}
            className={({ isActive }) =>
              "nav-item" + (isActive ? " nav-item--aktif" : "")
            }
          >
            <span className="nav-icon-wrap">
              <Ikon className="nav-icon" />
            </span>
            <span className="nav-label">{etiket}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}
