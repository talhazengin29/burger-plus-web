import { useNavigate, useSearchParams } from "react-router-dom";
import { IconCheck } from "../components/Icons";
import "./OrderReceived.css";

/*
  Masa siparişi mutfağa iletildikten sonraki onay ekranı.
  Ödeme ve puan YOK — bunlar yemek sonuna ait.
*/
export default function OrderReceived() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("masa") || "?";

  return (
    <div className="ekran order-received">
      <div className="or-icerik">
        <div className="or-daire">
          <IconCheck className="or-check" />
        </div>

        <h1 className="or-baslik">Siparişin Alındı!</h1>
        <p className="or-alt">Masa {masaNo} için siparişin mutfağa iletildi.</p>

        <div className="or-bilgi-kart">
          <div className="or-bilgi-satir">
            <span className="or-bilgi-etiket">Masa</span>
            <span className="or-bilgi-deger">Masa {masaNo}</span>
          </div>
          <div className="or-bilgi-satir">
            <span className="or-bilgi-etiket">Durum</span>
            <span className="or-bilgi-durum">Hazırlanıyor</span>
          </div>
        </div>

        <p className="or-odeme-not">
          Ödemeni yemek sonunda masada yapabilirsin.
        </p>

        <button className="or-btn" onClick={() => git("/anasayfa")}>
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
