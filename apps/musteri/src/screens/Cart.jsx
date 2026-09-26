import { useEffect } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { IconBack, IconPlus, IconMinus, IconTrash, IconBag, IconTakeaway, IconTableService } from "../components/Icons";
import { gramajMetni, haricMalzemeleriGetir, varsayilanSecimliUrunHazirla } from "../lib/urunSecimleri";
import { useDil } from "../dil/DilContext";
import "./Cart.css";

export default function Cart() {
  const { t, yerelAlan } = useDil();
  const git = useIsletmeNavigate();
  const { sepet, adetArtir, adetAzalt, sepettenCikar, sepetToplam, aktifMasa, oneriler, oneriReferansi, oneriOlayiGonder, sepeteEkle, urunler } = useApp();

  useEffect(() => {
    if (!oneriReferansi) return;
    oneriler.forEach((urun) => {
      oneriOlayiGonder({ referans: oneriReferansi, urunId: urun.id, olay: "goruntulendi" }).catch(() => {});
    });
  }, [oneriReferansi, oneriler, oneriOlayiGonder]);

  const oneriAciklamasi = (urun) => {
    if (urun.oneriNedeni === "birlikte_aliniyor" && urun.oneriGuveni != null) {
      return t("cart.frequentPair", { rate: urun.oneriGuveni });
    }
    if (urun.oneriNedeni === "isletme_secimi") return t("cart.restaurantPick");
    if (urun.oneriNedeni === "iyi_donusum") return t("cart.highConversionPick");
    return t("cart.popularPick");
  };

  const oneriyiAc = (urun) => {
    oneriOlayiGonder({ referans: oneriReferansi, urunId: urun.id, olay: "tiklandi" }).catch(() => {});
    git(`/urun/${urun.id}?kaynak=sepet_onerisi`, {
      state: {
        oneriReferansi,
        oneriFirsati: {
          id: urun.id,
          fiyat: urun.fiyat,
          normalFiyat: urun.normalFiyat,
          oneriIndirimYuzde: urun.oneriIndirimYuzde,
        },
      },
    });
  };

  const oneriyiEkle = async (urun) => {
    if (urun.ekstraMalzemeAyari?.aktif) {
      oneriyiAc(urun);
      return;
    }
    oneriOlayiGonder({ referans: oneriReferansi, urunId: urun.id, olay: "tiklandi" }).catch(() => {});
    let dogrulanmisReferans = null;
    try {
      await oneriOlayiGonder({ referans: oneriReferansi, urunId: urun.id, olay: "sepete_eklendi" });
      dogrulanmisReferans = oneriReferansi;
    } catch { /* Öneri ölçümü kullanıcıyı sepete eklemekten alıkoymaz. */ }
    const hazirUrun = varsayilanSecimliUrunHazirla(urun, urunler);
    sepeteEkle(dogrulanmisReferans
      ? { ...hazirUrun, oneriReferansi: dogrulanmisReferans }
      : { ...hazirUrun, fiyat: Number(urun.normalFiyat ?? urun.fiyat), normalFiyat: undefined, oneriIndirimYuzde: 0 });
  };

  return (
    <div className="ekran cart">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label={t("common.back")}>
          <IconBack />
        </button>
        <h1 className="alt-header-baslik">{t("cart.title")}</h1>
        <span className="alt-header-bosluk" />
      </header>

      {sepet.length === 0 ? (
        <div className="sepet-bos">
          <IconBag className="sepet-bos-ikon" />
          <p className="sepet-bos-yazi">{t("cart.empty")}</p>
          <button className="sepet-bos-btn" onClick={() => git("/anasayfa")}>
            {t("cart.backToMenu")}
          </button>
        </div>
      ) : (
        <>
          <div className="cart-govde">
            <div className="cart-liste">
              {sepet.map((u) => (
                <article key={u.sepetAnahtari || u.id} className="cart-satir">
                  <img className="cart-gorsel" src={u.gorsel} alt={yerelAlan(u, "ad", u.ad)} />
                  <div className="cart-orta">
                    <h3 className="cart-ad">{yerelAlan(u, "ad", u.ad)}</h3>
                    {u.hediyeMi ? (
                      <span className="cart-hediye-etiket">{t("cart.gift")}</span>
                    ) : (
                      <span className="cart-birim">
                        {u.uygulananIndirimKaynagi === "oneri" && Number(u.orijinalFiyat) > Number(u.fiyat) && <del>₺{u.orijinalFiyat.toFixed(2)}</del>}
                        ₺{u.fiyat.toFixed(2)}
                      </span>
                    )}
                    {u.uygulananIndirimKaynagi === "oneri" && <span className="cart-sepete-ozel">{t("cart.cartOnlyDiscount", { rate: u.oneriIndirimYuzde })}</span>}
                    {gramajMetni(u.secimler) && (
                      <span className="cart-gramaj">{gramajMetni(u.secimler)}</span>
                    )}
                    {haricMalzemeleriGetir(u).length > 0 && (
                      <span className="cart-haric-malzeme">{t("common.excluded", { items: haricMalzemeleriGetir(u).join(", ") })}</span>
                    )}
                  </div>
                  <div className="cart-sag">
                    <button className="cart-sil" onClick={() => sepettenCikar(u.sepetAnahtari)} aria-label={t("common.remove")}>
                      <IconTrash />
                    </button>
                    <div className="adet-kontrol">
                      <button onClick={() => adetAzalt(u.sepetAnahtari)} aria-label={t("common.decrease")}><IconMinus /></button>
                      <span className="adet-sayi">{u.adet}</span>
                      <button onClick={() => adetArtir(u.sepetAnahtari)} aria-label={t("common.increase")}><IconPlus /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {oneriler.length > 0 && <section className="cart-oneriler">
              <header>
                <div><span>{t("cart.recommendationEyebrow")}</span><h2>{t("cart.completeOrder")}</h2></div>
                <small>{t("cart.recommendationHint")}</small>
              </header>
              <div className="cart-oneri-listesi">
                {oneriler.map((urun) => <article className="cart-oneri" key={urun.id}>
                  <button type="button" className="cart-oneri-urun" onClick={() => oneriyiAc(urun)}>
                    {urun.gorsel
                      ? <img src={urun.gorsel} alt="" />
                      : <span className="cart-oneri-gorselsiz">BP</span>}
                    <span className="cart-oneri-bilgi">
                      <b>{yerelAlan(urun, "ad", urun.ad)}</b>
                      <small>{oneriAciklamasi(urun)}</small>
                      {Number(urun.normalFiyat) > Number(urun.fiyat) ? <span className="cart-oneri-fiyat">
                        <del>₺{Number(urun.normalFiyat).toFixed(2)}</del>
                        <strong>₺{Number(urun.fiyat || 0).toFixed(2)}</strong>
                        <em>{t("cart.discountBadge", { rate: urun.oneriIndirimYuzde })}</em>
                      </span> : <strong>₺{Number(urun.fiyat || 0).toFixed(2)}</strong>}
                    </span>
                  </button>
                  <button type="button" className="cart-oneri-ekle" onClick={() => oneriyiEkle(urun)} aria-label={t("cart.addRecommendation", { name: yerelAlan(urun, "ad", urun.ad) })}>
                    <IconPlus />
                  </button>
                </article>)}
              </div>
            </section>}
          </div>

          {/* Alt sabit özet + sipariş tipi seçimi */}
          <div className="cart-alt-bar">
            <div className="cart-toplam-satir">
              <span>{t("cart.total")}</span>
              <span className="cart-toplam-tutar">₺{sepetToplam.toFixed(2)}</span>
            </div>

            {aktifMasa ? (
              /* QR ile masa seçili — doğrudan o masaya ödeme */
              <>
                <div className="cart-masa-bilgi"><IconTableService /> {t("cart.atTable", { number: aktifMasa })}</div>
                <button
                  className="odeme-gec-btn"
                  onClick={() => git(`/odeme?masa=${aktifMasa}`)}
                >
                  {t("cart.checkout")}
                </button>
              </>
            ) : (
              /* Masa seçili değil — Gel Al veya QR ile Masaya Servis */
              <>
                <p className="cart-secim-baslik">{t("cart.orderType")}</p>
                <div className="cart-secim-butonlar">
                  <button
                    className="siparis-tip-btn siparis-tip-btn--algotur"
                    onClick={() => git("/odeme")}
                  >
                    <IconTakeaway className="siparis-tip-ikon" />
                    {t("cart.pickup")}
                  </button>
                  <button className="siparis-tip-btn siparis-tip-btn--masa" onClick={() => git("/qr?mod=masa")}>
                    <IconTableService className="siparis-tip-ikon" />
                    {t("cart.tableService")}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
