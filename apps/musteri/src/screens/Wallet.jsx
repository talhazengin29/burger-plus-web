import { useCallback, useEffect, useState } from "react";
import { IconBack, IconWallet } from "../components/Icons";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { cuzdanOzetiniGetir } from "../lib/authApi";
import { socket } from "../lib/socket";
import "./Wallet.css";
import { useDil } from "../i18n/DilContext";

export default function Wallet() {
  const { t, tc, para, tarihSaat, yerellestir } = useDil();
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
        <h1 className="alt-header-baslik">{t("wallet.title")}</h1>
        <span className="alt-header-bosluk" />
      </header>
      <main className="wallet-govde">
        {hata && <p className="wallet-hata" role="alert">{hata}</p>}
        <section className="wallet-bakiye-karti">
          <div className="wallet-parilti" />
          <div className="wallet-kart-ust"><span><IconWallet /> {t("wallet.balance")}</span><small>{t("wallet.onlyHere")}</small></div>
          <strong>{cuzdan ? para(cuzdan.bakiye) : "—"}</strong>
          <p>{t("wallet.balanceInfo")}</p>
        </section>

        {ayar.aktif && (
          <section className="wallet-kampanya">
            <span className="wallet-kampanya-oran">{ayar.bonusAktif ? `%${ayar.bonusYuzde}` : "KASA"}</span>
            <div><h2>{yerellestir(ayar.kampanyaBasligi, ayar.ceviriler, "kampanyaBasligi")}</h2><p>{yerellestir(ayar.kampanyaAciklamasi, ayar.ceviriler, "kampanyaAciklamasi")}</p></div>
            <small>{t("wallet.cashOnly", { min: para(ayar.minYukleme), max: para(ayar.maxYukleme) })}</small>
          </section>
        )}

        <section className="wallet-gecmis">
          <div className="wallet-bolum-baslik"><h2>{t("wallet.transactions")}</h2><span>{tc("wallet.transactionCount", cuzdan?.hareketler?.length || 0)}</span></div>
          {!cuzdan ? <p className="wallet-bos">{t("common.loading")}</p> : cuzdan.hareketler.length === 0 ? (
            <div className="wallet-bos"><span>₺</span><b>{t("wallet.empty")}</b><p>{t("wallet.emptyInfo")}</p></div>
          ) : cuzdan.hareketler.map((hareket) => (
            <article className="wallet-hareket" key={hareket.id}>
              <span className={`wallet-hareket-ikon ${hareket.tutar > 0 ? "arti" : "eksi"}`}>{hareket.tutar > 0 ? "+" : "−"}</span>
              <div><b>{hareket.aciklama}</b><small>{tarihSaat(hareket.tarih, { dateStyle: "short", timeStyle: "short" })}{hareket.personelAdi ? ` · ${hareket.personelAdi}` : ""}</small>{hareket.bonusTutar > 0 && <em>{para(hareket.nakitTutar)} nakit + {para(hareket.bonusTutar)} hediye</em>}</div>
              <strong className={hareket.tutar > 0 ? "arti" : "eksi"}>{hareket.tutar > 0 ? "+" : ""}{para(hareket.tutar)}</strong>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
