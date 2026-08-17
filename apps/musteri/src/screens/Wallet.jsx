import { useCallback, useEffect, useState } from "react";
import { IconBack, IconWallet } from "../components/Icons";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { cuzdanOzetiniGetir } from "../lib/authApi";
import { socket } from "../lib/socket";
import "./Wallet.css";

const para = (deger) => `₺${Number(deger || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Wallet() {
  const git = useIsletmeNavigate();
  const [cuzdan, setCuzdan] = useState(null);
  const [hata, setHata] = useState("");

  const yenile = useCallback(async () => {
    try {
      setCuzdan(await cuzdanOzetiniGetir());
      setHata("");
    } catch (e) {
      setHata(e.message || "Cüzdan yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    yenile();
    const guncellendi = () => yenile();
    socket.on("cuzdan-guncellendi", guncellendi);
    socket.on("cuzdan-ayari-guncellendi", guncellendi);
    return () => {
      socket.off("cuzdan-guncellendi", guncellendi);
      socket.off("cuzdan-ayari-guncellendi", guncellendi);
    };
  }, [yenile]);

  const ayar = cuzdan?.ayar || {};
  return (
    <div className="ekran wallet">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Cüzdanım</h1>
        <span className="alt-header-bosluk" />
      </header>
      <main className="wallet-govde">
        {hata && <p className="wallet-hata" role="alert">{hata}</p>}
        <section className="wallet-bakiye-karti">
          <div className="wallet-parilti" />
          <div className="wallet-kart-ust"><span><IconWallet /> Uygulama bakiyesi</span><small>SADECE BU İŞLETMEDE</small></div>
          <strong>{cuzdan ? para(cuzdan.bakiye) : "—"}</strong>
          <p>Bakiyeni sipariş ödemelerinde güvenle kullanabilirsin.</p>
        </section>

        {ayar.aktif && (
          <section className="wallet-kampanya">
            <span className="wallet-kampanya-oran">{ayar.bonusAktif ? `%${ayar.bonusYuzde}` : "KASA"}</span>
            <div><h2>{ayar.kampanyaBasligi}</h2><p>{ayar.kampanyaAciklamasi}</p></div>
            <small>Yükleme yalnızca kasadan ve nakit yapılır · {para(ayar.minYukleme)}–{para(ayar.maxYukleme)}</small>
          </section>
        )}

        <section className="wallet-gecmis">
          <div className="wallet-bolum-baslik"><h2>Bakiye hareketleri</h2><span>{cuzdan?.hareketler?.length || 0} işlem</span></div>
          {!cuzdan ? <p className="wallet-bos">Yükleniyor…</p> : cuzdan.hareketler.length === 0 ? (
            <div className="wallet-bos"><span>₺</span><b>Henüz bakiye hareketin yok</b><p>Kasada telefon numaranı söyleyerek nakit bakiye yükleyebilirsin.</p></div>
          ) : cuzdan.hareketler.map((hareket) => (
            <article className="wallet-hareket" key={hareket.id}>
              <span className={`wallet-hareket-ikon ${hareket.tutar > 0 ? "arti" : "eksi"}`}>{hareket.tutar > 0 ? "+" : "−"}</span>
              <div><b>{hareket.aciklama}</b><small>{new Date(hareket.tarih).toLocaleString("tr-TR")}{hareket.personelAdi ? ` · ${hareket.personelAdi}` : ""}</small>{hareket.bonusTutar > 0 && <em>{para(hareket.nakitTutar)} nakit + {para(hareket.bonusTutar)} hediye</em>}</div>
              <strong className={hareket.tutar > 0 ? "arti" : "eksi"}>{hareket.tutar > 0 ? "+" : ""}{para(hareket.tutar)}</strong>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
