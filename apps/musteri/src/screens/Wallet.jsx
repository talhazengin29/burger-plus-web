import { useCallback, useEffect, useState } from "react";
import { IconBack, IconWallet } from "../components/Icons";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { cuzdanOzetiniGetir } from "../lib/authApi";
import { socket } from "../lib/socket";
import { useDil } from "../dil/DilContext";
import "./Wallet.css";

const para = (deger, locale) => `₺${Number(deger || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Wallet() {
  const git = useIsletmeNavigate();
  const { dil, locale, t, yerelAlan } = useDil();
  const [cuzdan, setCuzdan] = useState(null);
  const [hata, setHata] = useState("");

  const yenile = useCallback(async () => {
    try {
      setCuzdan(await cuzdanOzetiniGetir());
      setHata("");
    } catch (e) {
      setHata(e.message || t("wallet.loadFailed"));
    }
  }, [t]);

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
  const varsayilanBaslik = dil === "en" && ayar.kampanyaBasligi === "Nakit yüklemene ekstra bakiye"
    ? t("wallet.defaultCampaignTitle")
    : ayar.kampanyaBasligi;
  const varsayilanAciklama = dil === "en" && ayar.kampanyaAciklamasi === "Kasadan nakit yükle, bonus bakiyeni anında kullan."
    ? t("wallet.defaultCampaignText")
    : ayar.kampanyaAciklamasi;
  const kampanyaBasligi = yerelAlan(ayar, "kampanyaBasligi", varsayilanBaslik);
  const kampanyaAciklamasi = yerelAlan(ayar, "kampanyaAciklamasi", varsayilanAciklama);
  return (
    <div className="ekran wallet">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label={t("common.back")}><IconBack /></button>
        <h1 className="alt-header-baslik">{t("wallet.title")}</h1>
        <span className="alt-header-bosluk" />
      </header>
      <main className="wallet-govde">
        {hata && <p className="wallet-hata" role="alert">{hata}</p>}
        <section className="wallet-bakiye-karti">
          <div className="wallet-parilti" />
          <div className="wallet-kart-ust"><span><IconWallet /> {t("wallet.appBalance")}</span><small>{t("wallet.onlyHere")}</small></div>
          <strong>{cuzdan ? para(cuzdan.bakiye, locale) : "—"}</strong>
          <p>{t("wallet.balanceHint")}</p>
        </section>

        {ayar.aktif && (
          <section className="wallet-kampanya">
            <span className="wallet-kampanya-oran">{ayar.bonusAktif ? `%${ayar.bonusYuzde}` : t("wallet.cashLabel")}</span>
            <div><h2>{kampanyaBasligi}</h2><p>{kampanyaAciklamasi}</p></div>
            <small>{t("wallet.loadRange", { min: para(ayar.minYukleme, locale), max: para(ayar.maxYukleme, locale) })}</small>
          </section>
        )}

        <section className="wallet-gecmis">
          <div className="wallet-bolum-baslik"><h2>{t("wallet.movements")}</h2><span>{t("wallet.transactionCount", { count: cuzdan?.hareketler?.length || 0 })}</span></div>
          {!cuzdan ? <p className="wallet-bos">{t("wallet.loading")}</p> : cuzdan.hareketler.length === 0 ? (
            <div className="wallet-bos"><span>₺</span><b>{t("wallet.empty")}</b><p>{t("wallet.emptyHint")}</p></div>
          ) : cuzdan.hareketler.map((hareket) => (
            <article className="wallet-hareket" key={hareket.id}>
              <span className={`wallet-hareket-ikon ${hareket.tutar > 0 ? "arti" : "eksi"}`}>{hareket.tutar > 0 ? "+" : "−"}</span>
              <div><b>{hareket.aciklama}</b><small>{new Date(hareket.tarih).toLocaleString(locale)}{hareket.personelAdi ? ` · ${hareket.personelAdi}` : ""}</small>{hareket.bonusTutar > 0 && <em>{t("wallet.cashAndGift", { cash: para(hareket.nakitTutar, locale), gift: para(hareket.bonusTutar, locale) })}</em>}</div>
              <strong className={hareket.tutar > 0 ? "arti" : "eksi"}>{hareket.tutar > 0 ? "+" : ""}{para(hareket.tutar, locale)}</strong>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
