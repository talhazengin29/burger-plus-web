import { useNavigate } from "react-router-dom";
import { IconStar } from "../components/Icons";
import "./UyeOl.css";

/*
  Misafir, Profil veya Puanlarım'a girmeye çalışınca gösterilir.
  Misafirin hesabı/puanı olmadığı için bu sekmeler ona kapalı;
  yerine üyeliğe davet eden bir ekran çıkar.
  baslik/aciklama props ile hangi sekmeden gelindiğine göre değişir.
*/
export default function UyeOl({ baslik, aciklama }) {
  const git = useNavigate();

  return (
    <div className="ekran uyeol">
      <div className="uyeol-icerik">
        <div className="uyeol-daire">
          <IconStar className="uyeol-ikon" />
        </div>

        <h1 className="uyeol-baslik">{baslik || "Üye Ol"}</h1>
        <p className="uyeol-alt">{aciklama || "Bu bölümü kullanmak için üye olman gerekiyor."}</p>

        <ul className="uyeol-avantaj">
          <li>🎁 Her siparişte puan kazan</li>
          <li>🍔 Puanlarını ürünlerle takas et</li>
          <li>⭐ 5 al 1 bedava gibi ödüller</li>
          <li>📋 Sipariş geçmişini gör</li>
        </ul>

        <button className="uyeol-btn" onClick={() => git("/")}>
          Üye Ol / Giriş Yap
        </button>
        <button className="uyeol-btn-ikincil" onClick={() => git("/anasayfa")}>
          Şimdilik Menüye Dön
        </button>
      </div>
    </div>
  );
}
