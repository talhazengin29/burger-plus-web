import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { IconStar } from "../components/Icons";
import DilSecici from "../components/DilSecici";
import { useDil } from "../dil/DilContext";
import "./UyeOl.css";

/*
  Misafir, Profil veya Puanlarım'a girmeye çalışınca gösterilir.
  Misafirin hesabı/puanı olmadığı için bu sekmeler ona kapalı;
  yerine üyeliğe davet eden bir ekran çıkar.
  baslik/aciklama props ile hangi sekmeden gelindiğine göre değişir.
*/
export default function UyeOl({ baslik, aciklama, dilSecici = false }) {
  const git = useIsletmeNavigate();
  const { t } = useDil();

  return (
    <div className="ekran uyeol">
      <div className="uyeol-icerik">
        <div className="uyeol-daire">
          <IconStar className="uyeol-ikon" />
        </div>

        <h1 className="uyeol-baslik">{baslik || t("membership.title")}</h1>
        <p className="uyeol-alt">{aciklama || t("membership.intro")}</p>

        <ul className="uyeol-avantaj">
          <li>🎁 {t("membership.benefitPoints")}</li>
          <li>🍔 {t("membership.benefitRedeem")}</li>
          <li>⭐ {t("membership.benefitRewards")}</li>
          <li>📋 {t("membership.benefitHistory")}</li>
        </ul>

        <button className="uyeol-btn" onClick={() => git("/")}>
          {t("membership.joinOrSignIn")}
        </button>
        <button className="uyeol-btn-ikincil" onClick={() => git("/anasayfa")}>
          {t("membership.backToMenu")}
        </button>
        {dilSecici && (
          <div className="uyeol-dil-satir">
            <span>{t("language.label")}</span>
            <DilSecici />
          </div>
        )}
      </div>
    </div>
  );
}
