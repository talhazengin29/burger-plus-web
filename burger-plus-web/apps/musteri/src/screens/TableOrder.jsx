import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconBack } from "../components/Icons";
import "./TableOrder.css";

/*
  Masa sipariş ekranı. QR okutulduktan sonra gelir (?masa=7).
  Ödeme YOK — sipariş mutfağa iletilir, ödeme yemek sonuna kalır.
  Puan da bu aşamada kazanılmaz (ödeme sistemde değil).
*/
export default function TableOrder() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("masa") || "?";
  const { sepet, sepetToplam, siparisiGonder } = useApp();

  const gonder = () => {
    siparisiGonder(masaNo);
    git(`/siparis-alindi?masa=${masaNo}`);
  };

  return (
    <div className="ekran table-order">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Masaya Servis</h1>
        <span className="alt-header-bosluk" />
      </header>

      <div className="table-govde">
        {/* Masa rozeti */}
        <div className="masa-rozet-kart">
          <span className="masa-rozet-etiket">Masanız</span>
          <span className="masa-rozet-no">Masa {masaNo}</span>
        </div>

        <h2 className="table-bolum-baslik">Siparişin</h2>
        <div className="table-liste">
          {sepet.map((u) => (
            <div key={u.id} className="table-satir">
              <span className="table-adet">{u.adet}×</span>
              <span className="table-ad">{u.ad}</span>
              <span className="table-fiyat">₺{(u.fiyat * u.adet).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="table-toplam">
          <span>Toplam</span>
          <span className="table-toplam-tutar">₺{sepetToplam.toFixed(2)}</span>
        </div>

        <div className="table-bilgi">
          Siparişin mutfağa iletilecek. Ödemeyi yemek sonunda masada yapabilirsin.
        </div>
      </div>

      <div className="table-alt-bar">
        <button className="gonder-btn" onClick={gonder}>
          Siparişi Mutfağa Gönder
        </button>
      </div>
    </div>
  );
}
