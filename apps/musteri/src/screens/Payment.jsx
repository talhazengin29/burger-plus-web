import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { puanHesapla } from "../data/mockData";
import { IconBack, IconCard, IconWallet, IconUsers, IconBag, IconMinus, IconPlus, IconCheck, IconTableService } from "../components/Icons";
import { gramajMetni, haricMalzemeleriGetir } from "../lib/urunSecimleri";
import { cuzdanlaOdemeyiOnayla, cuzdanOzetiniGetir, iyzicoOdemesiniBaslat, nakitMasaDurumunuGetir, nakitSiparisGonder, odemeTaslagiOlustur } from "../lib/authApi";
import { socket } from "../lib/socket";
import { emailTemizle, formuDogrula, guvenliMetin, ilkHata, kurallar, telefonTemizle, temizMetin } from "../lib/dogrulama";
import { useDil } from "../dil/DilContext";
import "./Payment.css";

const YONTEMLER = [
  { id: "tam", ad: "payment.full", Ikon: IconWallet, aciklama: "payment.fullHint" },
  { id: "esit", ad: "payment.equal", Ikon: IconUsers, aciklama: "payment.equalHint", devreDisi: true },
  { id: "urun", ad: "payment.byProduct", Ikon: IconBag, aciklama: "payment.byProductHint" },
];

const ODEME_SEMASI = {
  ad: (deger) => kurallar.ad(deger, "Ad"),
  soyad: (deger) => kurallar.ad(deger, "Soyad"),
  email: kurallar.email,
  telefon: (deger) => kurallar.telefon(deger, true),
};

export default function Payment() {
  const { locale, t, yerelAlan } = useDil();
  const git = useIsletmeNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("masa");
  const masaModu = !!masaNo;
  const { sepet, sepetToplam, kullanici, misafir, sepetiBosalt, aktifMasaTokeni, odemeyiTamamla } = useApp();

  const [odemeTipi, setOdemeTipi] = useState("kart");
  const [yontem, setYontem] = useState("tam");
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [islemde, setIslemde] = useState(false);
  const [odemeHatasi, setOdemeHatasi] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [nakitMasa, setNakitMasa] = useState({ yukleniyor: masaModu, nakitAcik: false });
  const [nakitSiparis, setNakitSiparis] = useState(null);
  const [cuzdan, setCuzdan] = useState(null);
  const [seciliAdetler, setSeciliAdetler] = useState({});
  const [alici, setAlici] = useState(() => ({
    ad: kullanici?.ad || "", soyad: kullanici?.soyad || "", email: kullanici?.email || "",
    telefon: kullanici?.telefon || "+905",
  }));

  const nakitMasaDurumunuYenile = useCallback(async () => {
    if (!masaNo) {
      setNakitMasa({ yukleniyor: false, nakitAcik: false });
      return;
    }
    try {
      const durum = await nakitMasaDurumunuGetir(masaNo, aktifMasaTokeni);
      setNakitMasa({ ...durum, yukleniyor: false });
    } catch {
      setNakitMasa({ yukleniyor: false, nakitAcik: false });
    }
  }, [masaNo, aktifMasaTokeni]);

  useEffect(() => {
    nakitMasaDurumunuYenile();
    if (!masaNo) return undefined;
    const masayaKatil = () => socket.emit("masaya-katil", { masaNo, masaToken: aktifMasaTokeni });
    masayaKatil();
    const guncellendi = (veri) => {
      if (String(veri?.masaNo) !== String(masaNo)) return;
      if (veri.siparis) {
        setNakitSiparis((mevcut) => mevcut?.id === veri.siparis.id ? { ...mevcut, ...veri.siparis } : mevcut);
      }
      nakitMasaDurumunuYenile();
    };
    socket.on("nakit-masa-guncellendi", guncellendi);
    socket.on("connect", masayaKatil);
    return () => {
      socket.off("nakit-masa-guncellendi", guncellendi);
      socket.off("connect", masayaKatil);
    };
  }, [masaNo, aktifMasaTokeni, nakitMasaDurumunuYenile]);

  useEffect(() => {
    if (!kullanici?.id) return;
    cuzdanOzetiniGetir().then(setCuzdan).catch(() => setCuzdan(null));
  }, [kullanici?.id]);

  if (nakitSiparis) {
    const onaylandi = nakitSiparis.durum === "nakit_bekliyor" || nakitSiparis.durum === "basarili";
    const reddedildi = nakitSiparis.durum === "reddedildi";
    return (
      <div className="ekran payment nakit-sonuc">
        <div className="nakit-sonuc-icerik">
          <span className={"nakit-sonuc-ikon " + (reddedildi ? "nakit-sonuc-ikon--hata" : onaylandi ? "nakit-sonuc-ikon--tamam" : "") }>
            {reddedildi ? "×" : onaylandi ? "✓" : <span className="durum-spinner" />}
          </span>
          <small>{t("common.table", { number: nakitSiparis.masaNo })}</small>
          <h1>{reddedildi ? t("payment.rejected") : onaylandi ? t("payment.sent") : t("payment.waiting")}</h1>
          <p>{reddedildi
            ? t("payment.rejectedInfo")
            : onaylandi
              ? t("payment.sentInfo")
              : t("payment.waitingInfo")}</p>
          <div className="nakit-sonuc-ozet">
            <span>{t("payment.orderNo")}</span><strong>{nakitSiparis.siparisNo}</strong>
            <span>{t("payment.tablePayable")}</span><strong>₺{Number(nakitSiparis.tutar).toFixed(2)}</strong>
          </div>
          {onaylandi && <button className="ode-btn" onClick={() => git("/anasayfa")}>{t("common.menu")}</button>}
          {reddedildi && <button className="ode-btn" onClick={() => { setNakitSiparis(null); git("/anasayfa"); }}>{t("common.menu")}</button>}
        </div>
      </div>
    );
  }

  const aliciDegistir = (alan, deger) => {
    setAlici((onceki) => ({ ...onceki, [alan]: deger }));
    setAlanHatalari((onceki) => ({ ...onceki, [alan]: "" }));
    setOdemeHatasi("");
  };

  const alaniDogrula = (alan) => {
    setAlanHatalari((onceki) => ({ ...onceki, [alan]: ODEME_SEMASI[alan](alici[alan]) }));
  };

  if (sepet.length === 0) {
    return (
      <div className="ekran payment">
        <header className="alt-header">
          <button className="geri-btn" onClick={() => git("/anasayfa")} aria-label={t("common.back")}><IconBack /></button>
          <h1 className="alt-header-baslik">{t("payment.title")}</h1>
          <span className="alt-header-bosluk" />
        </header>
        <div className="odeme-bos">
          <p>{t("payment.empty")}</p>
          <button onClick={() => git("/anasayfa")}>{t("common.menu")}</button>
        </div>
      </div>
    );
  }

  // Ürün seçiminde adet artır/azalt
  const adetArtir = (id, maxAdet) => {
    setSeciliAdetler((o) => {
      const mevcut = o[id] || 0;
      if (mevcut >= maxAdet) return o;
      return { ...o, [id]: mevcut + 1 };
    });
  };
  const adetAzalt = (id) => {
    setSeciliAdetler((o) => {
      const mevcut = o[id] || 0;
      if (mevcut <= 0) return o;
      const yeni = { ...o };
      if (mevcut - 1 === 0) delete yeni[id];
      else yeni[id] = mevcut - 1;
      return yeni;
    });
  };
  // Tümünü seç / kaldır toggle
  const tumunuSec = (id, maxAdet) => {
    setSeciliAdetler((o) => {
      if ((o[id] || 0) > 0) {
        const yeni = { ...o };
        delete yeni[id];
        return yeni;
      }
      return { ...o, [id]: maxAdet };
    });
  };

  // Ödenen ürünleri hesapla (ürüne göre modda)
  const seciliUrunListesi = sepet
    .filter((u) => (seciliAdetler[u.sepetAnahtari] || 0) > 0)
    .map((u) => ({ ...u, adet: seciliAdetler[u.sepetAnahtari] }));

  // Ödenecek tutarı yönteme göre hesapla
  let odenecek = sepetToplam;
  let odenenUrunler = sepet; // tamamını öde → tüm sepet
  if (yontem === "esit") {
    odenecek = sepetToplam / kisiSayisi;
    // Eşit bölmede de tüm ürünler mutfağa gider
  } else if (yontem === "urun") {
    odenecek = seciliUrunListesi.reduce((t, u) => t + u.fiyat * u.adet, 0);
    odenenUrunler = seciliUrunListesi;
  }

  if (odemeTipi === "nakit") {
    odenecek = sepetToplam;
    odenenUrunler = sepet;
  }
  const kazanilacakPuan = puanHesapla(odenecek);
  const nakitKullanilabilir = masaModu && nakitMasa.nakitAcik;
  const odemeAktif = odemeTipi === "nakit"
    ? nakitKullanilabilir
    : odemeTipi === "cuzdan"
      ? Boolean(kullanici?.id && cuzdan?.ayar?.aktif && Number(cuzdan?.bakiye || 0) >= odenecek)
    : yontem !== "urun" || seciliUrunListesi.length > 0;

  const odeyVeBitir = async () => {
    if (!odemeAktif || islemde) return;
    setOdemeHatasi("");
    if (odemeTipi === "nakit") {
      setIslemde(true);
      try {
        const siparis = await nakitSiparisGonder({
          masaNo,
          urunler: sepet.map((u) => ({
            id: u.id,
            adet: u.adet,
            secimler: u.secimler || {},
            haricMalzemeler: u.haricMalzemeler || [],
          })),
        });
        sepetiBosalt();
        setNakitSiparis(siparis);
      } catch (e) {
        setOdemeHatasi(e.message || "Nakit sipariş gönderilemedi. Lütfen tekrar dene.");
        nakitMasaDurumunuYenile();
      } finally {
        setIslemde(false);
      }
      return;
    }
    let dogrulanmisAlici = null;
    if (odemeTipi === "kart") {
      const hatalar = formuDogrula(alici, ODEME_SEMASI);
      setAlanHatalari(hatalar);
      if (ilkHata(hatalar)) {
        setOdemeHatasi("Ödeme için işaretli fatura bilgilerini kontrol et.");
        return;
      }
      dogrulanmisAlici = {
        ad: temizMetin(alici.ad, 60), soyad: temizMetin(alici.soyad, 60),
        email: emailTemizle(alici.email), telefon: telefonTemizle(alici.telefon),
      };
    }
    setIslemde(true);
    try {
      const taslak = await odemeTaslagiOlustur({
        masaNo: masaNo || null,
        yontem,
        urunler: odenenUrunler.map((u) => ({
          id: u.id,
          adet: u.adet,
          secimler: u.secimler || {},
          haricMalzemeler: u.haricMalzemeler || [],
        })),
      });

      if (odemeTipi === "cuzdan") {
        const sonuc = await cuzdanlaOdemeyiOnayla(taslak.id);
        odemeyiTamamla(sonuc.odeme);
        setCuzdan(sonuc.cuzdan);
        git("/odeme-basarili");
      } else {
        const paymentPageUrl = await iyzicoOdemesiniBaslat(taslak.id, dogrulanmisAlici);
        window.location.assign(paymentPageUrl);
      }
    } catch (e) {
      setOdemeHatasi(e.message || "Ödeme başlatılamadı. Lütfen tekrar dene.");
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div className="ekran payment">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label={t("common.back")}><IconBack /></button>
        <h1 className="alt-header-baslik">{t("payment.title")}</h1>
        <span className="alt-header-bosluk" />
      </header>

      <div className="payment-govde">
        {masaModu && (
          <div className="odeme-masa-rozet"><IconTableService /> {t("payment.tableService", { number: masaNo })}</div>
        )}

        {misafir && (
          <div className="misafir-rozet">{t("payment.guest")}</div>
        )}

        <section className="secim-kutu odeme-urun-ozeti">
          <h3 className="secim-baslik">{t("payment.summary")}</h3>
          {sepet.map((u) => (
            <div key={u.sepetAnahtari || u.id} className="odeme-ozet-satir">
              <span className="odeme-ozet-ad">
                {yerelAlan(u, "ad", u.ad)} ×{u.adet}
                {gramajMetni(u.secimler) && <small>{gramajMetni(u.secimler)}</small>}
                {haricMalzemeleriGetir(u).length > 0 && <small>{t("common.excluded", { items: haricMalzemeleriGetir(u).join(", ") })}</small>}
              </span>
              <strong>₺{(u.fiyat * u.adet).toFixed(2)}</strong>
            </div>
          ))}
        </section>

        <h2 className="odeme-bolum-baslik">{t("payment.type")}</h2>
        <div className="odeme-tipi-grid">
          <button
            type="button"
            className={"odeme-tipi-kart" + (odemeTipi === "kart" ? " odeme-tipi-kart--aktif" : "")}
            onClick={() => setOdemeTipi("kart")}
          >
            <IconCard />
            <span><b>{t("payment.online")}</b><small>{t("payment.onlineHint")}</small></span>
          </button>
          <button
            type="button"
            className={"odeme-tipi-kart" + (odemeTipi === "cuzdan" ? " odeme-tipi-kart--aktif" : "")}
            onClick={() => kullanici?.id && cuzdan?.ayar?.aktif && setOdemeTipi("cuzdan")}
            disabled={!kullanici?.id || !cuzdan?.ayar?.aktif}
          >
            <IconWallet />
            <span><b>{t("payment.wallet")}</b><small>{!kullanici?.id ? t("payment.loginRequired") : !cuzdan?.ayar?.aktif ? t("payment.unavailable") : t("payment.available", { amount: Number(cuzdan?.bakiye || 0).toLocaleString(locale, { minimumFractionDigits: 2 }) })}</small></span>
          </button>
          <button
            type="button"
            className={"odeme-tipi-kart" + (odemeTipi === "nakit" ? " odeme-tipi-kart--aktif" : "")}
            onClick={() => nakitKullanilabilir && setOdemeTipi("nakit")}
            disabled={!nakitKullanilabilir}
          >
            <IconWallet />
            <span><b>{t("payment.cash")}</b><small>{!masaModu ? t("payment.tableOnly") : nakitMasa.yukleniyor ? t("payment.checkingTable") : nakitMasa.nakitAcik ? t("payment.payAfterMeal") : t("payment.staffMustOpen")}</small></span>
          </button>
        </div>
        {masaModu && !nakitMasa.yukleniyor && !nakitMasa.nakitAcik && (
          <p className="nakit-masa-uyari">{t("payment.cashWarning", { number: masaNo })}</p>
        )}

        {odemeTipi === "kart" && <section className="secim-kutu odeme-bilgi-kutu">
          <h3 className="secim-baslik">{t("payment.contact")}</h3>
          <p className="odeme-bilgi-not">{t("payment.contactHint")}</p>
          <div className="odeme-bilgi-grid">
            <label>{t("payment.firstName")}<input value={alici.ad} onChange={(e) => aliciDegistir("ad", guvenliMetin(e.target.value, 60))} onBlur={() => alaniDogrula("ad")} autoComplete="given-name" maxLength="60" required aria-invalid={Boolean(alanHatalari.ad)} />{alanHatalari.ad && <small className="alan-hata">{alanHatalari.ad}</small>}</label>
            <label>{t("payment.lastName")}<input value={alici.soyad} onChange={(e) => aliciDegistir("soyad", guvenliMetin(e.target.value, 60))} onBlur={() => alaniDogrula("soyad")} autoComplete="family-name" maxLength="60" required aria-invalid={Boolean(alanHatalari.soyad)} />{alanHatalari.soyad && <small className="alan-hata">{alanHatalari.soyad}</small>}</label>
            <label className="tam-genislik">{t("payment.email")}<input type="email" value={alici.email} onChange={(e) => aliciDegistir("email", e.target.value.slice(0, 254))} onBlur={() => alaniDogrula("email")} autoComplete="email" maxLength="254" required aria-invalid={Boolean(alanHatalari.email)} />{alanHatalari.email && <small className="alan-hata">{alanHatalari.email}</small>}</label>
            <label className="tam-genislik">{t("payment.phone")}<input inputMode="tel" placeholder="+905XXXXXXXXX" value={alici.telefon} onChange={(e) => aliciDegistir("telefon", e.target.value.slice(0, 20))} onBlur={() => alaniDogrula("telefon")} autoComplete="tel" maxLength="20" required aria-invalid={Boolean(alanHatalari.telefon)} />{alanHatalari.telefon && <small className="alan-hata">{alanHatalari.telefon}</small>}</label>
          </div>
        </section>}

        {/* Yöntem seçimi — misafir sadece tamamını öder */}
        {(odemeTipi === "kart" || odemeTipi === "cuzdan") && !misafir && (
          <>
            <h2 className="odeme-bolum-baslik">{t("payment.how")}</h2>
            <div className="yontem-grid">
              {YONTEMLER.map(({ id, ad, Ikon, aciklama, devreDisi }) => (
                <button
                  key={id}
                  className={"yontem-kart" + (yontem === id ? " yontem-kart--aktif" : "") + (devreDisi ? " yontem-kart--pasif" : "")}
                  onClick={() => !devreDisi && setYontem(id)}
                  disabled={devreDisi}
                >
                  <Ikon className="yontem-ikon" />
                  <span className="yontem-ad">{t(ad)}</span>
                  <span className="yontem-aciklama">{t(aciklama)}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {odemeTipi === "cuzdan" && Number(cuzdan?.bakiye || 0) < odenecek && (
          <p className="nakit-masa-uyari">{t("payment.insufficient")}</p>
        )}

        {/* Eşit böl: kişi sayısı */}
        {odemeTipi === "kart" && !misafir && yontem === "esit" && (
          <section className="secim-kutu">
            <h3 className="secim-baslik">{t("payment.people")}</h3>
            <div className="kisi-secici">
              <button onClick={() => setKisiSayisi((k) => Math.max(2, k - 1))} aria-label={t("common.decrease")}><IconMinus /></button>
              <span className="kisi-sayi">{kisiSayisi}</span>
              <button onClick={() => setKisiSayisi((k) => Math.min(20, k + 1))} aria-label={t("common.increase")}><IconPlus /></button>
            </div>
            <p className="kisi-not">{t("payment.perPerson", { amount: `₺${(sepetToplam / kisiSayisi).toFixed(2)}` })}</p>
          </section>
        )}

        {/* Ürüne göre: adet bazlı seçim */}
        {odemeTipi === "kart" && !misafir && yontem === "urun" && (
          <section className="secim-kutu">
            <h3 className="secim-baslik">{t("payment.chooseProducts")}</h3>
            <div className="urun-sec-liste">
              {sepet.map((u) => {
                const anahtar = u.sepetAnahtari;
                const seciliAdet = seciliAdetler[anahtar] || 0;
                const secili = seciliAdet > 0;
                return (
                  <div
                    key={anahtar}
                    className={"urun-sec-satir" + (secili ? " urun-sec-satir--secili" : "")}
                  >
                    {/* Sol: ürün bilgisi + tıklayınca tümünü seç/kaldır */}
                    <button
                      className="urun-sec-sol"
                      onClick={() => tumunuSec(anahtar, u.adet)}
                    >
                      <span className={"sec-kutu" + (secili ? " sec-kutu--dolu" : "")}>
                        {secili && <IconCheck />}
                      </span>
                      <span className="urun-sec-ad">
                        {yerelAlan(u, "ad", u.ad)}
                        {gramajMetni(u.secimler) && <small>{gramajMetni(u.secimler)}</small>}
                        {haricMalzemeleriGetir(u).length > 0 && <small>{t("common.excluded", { items: haricMalzemeleriGetir(u).join(", ") })}</small>}
                      </span>
                    </button>

                    {/* Sağ: adet seçici (birden fazla ise) */}
                    <div className="urun-sec-sag">
                      {u.adet > 1 ? (
                        <div className="urun-adet-secici">
                          <button
                            className="urun-adet-btn"
                            onClick={() => adetAzalt(anahtar)}
                            disabled={seciliAdet === 0}
                          >
                            <IconMinus />
                          </button>
                          <span className="urun-adet-sayi">{seciliAdet}/{u.adet}</span>
                          <button
                            className="urun-adet-btn"
                            onClick={() => adetArtir(anahtar, u.adet)}
                            disabled={seciliAdet === u.adet}
                          >
                            <IconPlus />
                          </button>
                        </div>
                      ) : null}
                      <span className="urun-sec-fiyat">
                        ₺{(u.fiyat * (secili ? seciliAdet : u.adet)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Puan bilgisi */}
        {!misafir && (
          <div className="puan-bilgi">
            <span className="puan-bilgi-ikon">⭐</span>
            <span>{odemeTipi === "nakit" ? t("payment.pointsCash") : t("payment.pointsPayment")} <strong>{t("payment.pointsEarn", { points: kazanilacakPuan })}</strong></span>
          </div>
        )}
        {odemeHatasi && <p className="odeme-hata" role="alert">{odemeHatasi}</p>}
      </div>

      {/* Alt sabit ödeme bar */}
      <div className="payment-alt-bar">
        <div className="odenecek-satir">
          <span>{t("payment.payable")}</span>
          <span className="odenecek-tutar">₺{odenecek.toFixed(2)}</span>
        </div>
        <button
          className={"ode-btn" + (!odemeAktif ? " ode-btn--pasif" : "")}
          onClick={odeyVeBitir}
          disabled={!odemeAktif || islemde}
        >
          {islemde
            ? odemeTipi === "nakit" ? t("payment.sending") : t("payment.preparing")
            : odemeTipi === "nakit" ? t("payment.sendOrder") : t("payment.pay")}
        </button>
      </div>
    </div>
  );
}
