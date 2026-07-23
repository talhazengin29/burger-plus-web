import { sadakatVarsayilan, oduller, puanGecmisi } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { IconMenu, IconUser, IconShop, IconTicket, IconCutlery, IconGift } from "../components/Icons";
import UyeOl from "./UyeOl";
import "./Rewards.css";

export default function Rewards() {
  const { puan, misafir } = useApp();

  // Misafir puan bölümüne giremez — üyeliğe davet ekranı göster
  if (misafir) {
    return (
      <UyeOl
        baslik="Puan Kazanmaya Başla"
        aciklama="Puanlar üyelere özel. Üye ol, her siparişte puan biriktir, ödüller kazan."
      />
    );
  }

  const hedef = sadakatVarsayilan.hedefPuan;
  const yuzde = Math.min((puan / hedef) * 100, 100);
  const kalan = Math.max(hedef - puan, 0);

  return (
    <div className="ekran rewards">
      {/* Basit üst bar */}
      <header className="basit-header">
        <button className="ikon-btn koyu" aria-label="Menü"><IconMenu /></button>
        <span className="basit-baslik">BURGER PLUS</span>
        <button className="daire-btn" aria-label="Profil"><IconUser /></button>
      </header>

      <div className="rewards-govde">
        {/* Toplam puan kartı */}
        <section className="puan-kart">
          <span className="puan-ust-cizgi" />
          <h2 className="puan-kart-baslik">Toplam Puanım</h2>
          <div className="puan-buyuk">
            {puan.toLocaleString("tr-TR")}<span className="puan-birim">Puan</span>
          </div>
          <div className="puan-etiket-satir">
            <span>Başlangıç</span>
            <span className="puan-hedef">Hediye Burger ({hedef.toLocaleString("tr-TR")} Puan)</span>
          </div>
          <div className="ilerleme-ray">
            <div className="ilerleme-dolgu" style={{ width: `${yuzde}%` }} />
          </div>
          <p className="puan-kalan">
            Hediyeye sadece <strong>{kalan.toLocaleString("tr-TR")} puan</strong> kaldı!
          </p>
        </section>

        {/* Ödül Marketi */}
        <div className="bolum-basrivi">
          <h3 className="bolum-baslik">Ödül Marketi</h3>
          <IconShop className="bolum-ikon" />
        </div>

        <div className="odul-grid">
          {oduller.map((o) => (
            <article key={o.id} className="odul-kart">
              <div className="odul-gorsel-wrap">
                {o.gorsel ? (
                  <img className="odul-gorsel" src={o.gorsel} alt={o.ad} />
                ) : (
                  <div className="odul-ikon-kutu"><IconTicket className="odul-buyuk-ikon" /></div>
                )}
              </div>
              <div className="odul-alt">
                <h4 className="odul-ad">{o.ad}</h4>
                <div className="odul-fiyat-satir">
                  <span className="odul-puan">{o.puan.toLocaleString("tr-TR")} Puan</span>
                  <button className="odul-ekle" aria-label={`${o.ad} al`}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Puan Geçmişi */}
        <h3 className="bolum-baslik gecmis-baslik">Puan Geçmişi</h3>
        <div className="gecmis-liste">
          {puanGecmisi.map((g) => (
            <div key={g.id} className="gecmis-satir">
              <div className="gecmis-ikon-daire">
                {g.tip === "kazanc" ? <IconCutlery className="gecmis-ikon" /> : <IconGift className="gecmis-ikon" />}
              </div>
              <div className="gecmis-orta">
                <span className="gecmis-ad">{g.baslik}</span>
                <span className="gecmis-tarih">{g.tarih}</span>
              </div>
              <span className={"gecmis-puan " + (g.tip === "kazanc" ? "arti" : "eksi")}>
                {g.puan > 0 ? `+${g.puan}` : g.puan}
              </span>
            </div>
          ))}
        </div>
        <button className="tumunu-gor">Tümünü Gör</button>
      </div>
    </div>
  );
}
