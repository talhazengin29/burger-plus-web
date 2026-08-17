import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useIsletme } from "../context/IsletmeContext";
import { IconBack, IconMinus, IconPlus, IconWarning } from "../components/Icons";
import { siraliKonteyner, siraliOge } from "../lib/animasyonlar";
import { varsayilanSecimliUrunHazirla } from "../lib/urunSecimleri";
import "./UrunDetay.css";
import { useDil } from "../i18n/DilContext";

// Besin değerleri sabit sırayla gösterilir
const besinEtiketleri = [
  { anahtar: "kalori", etiket: "Kalori" },
  { anahtar: "protein", etiket: "Protein" },
  { anahtar: "karbonhidrat", etiket: "Karbonhidrat" },
  { anahtar: "yag", etiket: "Yağ" },
];

export default function UrunDetay() {
  const { dil, t, para, yerellestir } = useDil();
  const { id } = useParams();
  const git = useIsletmeNavigate();
  const { isletmeSlug } = useIsletme();
  const { sepeteEkle, indirimliFiyat, urunler } = useApp();
  const [adet, setAdet] = useState(1);
  const [haricMalzemeler, setHaricMalzemeler] = useState([]);
  const [gramajAdimi, setGramajAdimi] = useState(0);
  const [boyutKodu, setBoyutKodu] = useState("");
  const [yanBoyutKodu, setYanBoyutKodu] = useState("");
  const [icecekBoyutKodu, setIcecekBoyutKodu] = useState("");
  const [ekstraMalzemeIdleri, setEkstraMalzemeIdleri] = useState([]);
  const [eklenenOneriIdleri, setEklenenOneriIdleri] = useState([]);

  const urun = urunler.find((u) => String(u.id) === id);
  if (!urun) return <Navigate to={`/${isletmeSlug}/anasayfa`} replace />;
  const urunAdi = yerellestir(urun.ad, urun.ceviriler, "ad", `product.${urun.id}.name`);
  const urunAciklamasi = yerellestir(urun.aciklama, urun.ceviriler, "aciklama", `product.${urun.id}.description`);
  const stoktaYok = urun.stokta === false;
  const urunOnerileri = (urun.onerilenUrunler || [])
    .map((onerilenId) => urunler.find((aday) => Number(aday.id) === Number(onerilenId)))
    .filter((aday) => aday && Number(aday.id) !== Number(urun.id))
    .slice(0, 3);
  const gorunenUrunOnerileri = urunOnerileri.filter(
    (onerilen) => !eklenenOneriIdleri.includes(Number(onerilen.id))
  );

  const indirim = indirimliFiyat(urun);
  const urunTipi = urun.urunTipi || "burger";
  const menuYapisi = urunTipi === "menu" ? urun.menuYapisi : null;
  const menuBurger = menuYapisi ? urunler.find((aday) => Number(aday.id) === Number(menuYapisi.burgerUrunId)) : null;
  const menuYanLezzet = menuYapisi ? urunler.find((aday) => Number(aday.id) === Number(menuYapisi.yanLezzetUrunId)) : null;
  const menuIcecek = menuYapisi ? urunler.find((aday) => Number(aday.id) === Number(menuYapisi.icecekUrunId)) : null;
  const gramajKaynagi = menuBurger || urun;
  const malzemeListesi = gramajKaynagi.malzemeler || [];
  const miktarAyari = gramajKaynagi.gramajOpsiyonu || null;
  const miktarGoster = Boolean(miktarAyari) && miktarAyari.goster !== false && Number(gramajKaynagi.temelMiktar) > 0;
  const gramajOpsiyonu = miktarGoster && miktarAyari?.aktif ? miktarAyari : null;
  const ekstraGramaj = gramajOpsiyonu ? gramajAdimi * gramajOpsiyonu.artisMiktari : 0;
  const toplamGramaj = Number(gramajKaynagi.temelMiktar || 0) + ekstraGramaj;
  const gramajFiyatArtisi = gramajOpsiyonu ? gramajAdimi * gramajOpsiyonu.fiyatArtisi : 0;
  const varsayilanBoyut = (boyutlar, kod) => boyutlar?.find((boyut) => boyut.kod === kod) || boyutlar?.find((boyut) => boyut.varsayilan) || boyutlar?.[0] || null;
  const tekUrunVarsayilanBoyut = varsayilanBoyut(urun.boyutSecenekleri, null);
  const tekUrunBoyut = varsayilanBoyut(urun.boyutSecenekleri, boyutKodu);
  const varsayilanYanBoyut = varsayilanBoyut(menuYanLezzet?.boyutSecenekleri, menuYapisi?.varsayilanYanBoyut);
  const secilenYanBoyut = varsayilanBoyut(menuYanLezzet?.boyutSecenekleri, yanBoyutKodu || menuYapisi?.varsayilanYanBoyut);
  const varsayilanIcecekBoyut = varsayilanBoyut(menuIcecek?.boyutSecenekleri, menuYapisi?.varsayilanIcecekBoyut);
  const secilenIcecekBoyut = varsayilanBoyut(menuIcecek?.boyutSecenekleri, icecekBoyutKodu || menuYapisi?.varsayilanIcecekBoyut);
  const boyutFiyatArtisi = urunTipi === "menu"
    ? Number(secilenYanBoyut?.fiyatFarki || 0) - Number(varsayilanYanBoyut?.fiyatFarki || 0) + Number(secilenIcecekBoyut?.fiyatFarki || 0) - Number(varsayilanIcecekBoyut?.fiyatFarki || 0)
    : ["yan_lezzet", "icecek"].includes(urunTipi)
      ? Number(tekUrunBoyut?.fiyatFarki || 0) - Number(tekUrunVarsayilanBoyut?.fiyatFarki || 0)
      : 0;
  const ekstraMalzemeAyari = urun.ekstraMalzemeAyari?.aktif ? urun.ekstraMalzemeAyari : null;
  const ekstraSecenekler = ekstraMalzemeAyari?.secenekler?.filter((secenek) => secenek.aktif !== false) || [];
  const seciliEkstraMalzemeler = ekstraSecenekler.filter((secenek) => ekstraMalzemeIdleri.includes(String(secenek.id)));
  const ekstraMalzemeFiyati = seciliEkstraMalzemeler.reduce((toplam, secenek) => toplam + Number(secenek.fiyat || 0), 0);
  const minimumEkstraSecimi = Number(ekstraMalzemeAyari?.minSecim || 0);
  const maksimumEkstraSecimi = Number(ekstraMalzemeAyari?.maxSecim || 1);
  const ekstraSecimiEksik = ekstraMalzemeAyari && ekstraMalzemeIdleri.length < minimumEkstraSecimi;
  const toplamFiyatArtisi = gramajFiyatArtisi + boyutFiyatArtisi + ekstraMalzemeFiyati;
  const birimFiyat = (indirim ? indirim.fiyat : urun.fiyat) + toplamFiyatArtisi;

  const malzemeToggle = (malzeme) => {
    setHaricMalzemeler((onceki) =>
      onceki.includes(malzeme)
        ? onceki.filter((m) => m !== malzeme) // tekrar tıkla → geri ekle
        : [...onceki, malzeme]                 // tıkla → çıkar
    );
  };

  const ekstraMalzemeToggle = (secenekId) => {
    const id = String(secenekId);
    setEkstraMalzemeIdleri((onceki) => {
      if (onceki.includes(id)) return onceki.filter((mevcutId) => mevcutId !== id);
      if (maksimumEkstraSecimi === 1) return [id];
      if (onceki.length >= maksimumEkstraSecimi) return onceki;
      return [...onceki, id];
    });
  };

  const sepeteEkleyeBas = () => {
    if (stoktaYok || ekstraSecimiEksik) return;
    const dahilMalzemeler = malzemeListesi.filter((m) => !haricMalzemeler.includes(m));
    const secimler = {
      dahilMalzemeler,
      haricMalzemeler,
      ...(miktarGoster ? {
        ekstraGramaj,
        standartGramaj: Number(gramajKaynagi.temelMiktar || 0),
        toplamGramaj,
        gramajEtiketi: miktarAyari.etiket,
        gramajBirim: miktarAyari.birim,
      } : {}),
      ...(["yan_lezzet", "icecek"].includes(urunTipi) && tekUrunBoyut ? {
        boyutKodu: tekUrunBoyut.kod, boyutEtiketi: tekUrunBoyut.etiket,
        boyutMiktar: tekUrunBoyut.miktar, boyutBirim: tekUrunBoyut.birim,
      } : {}),
      ...(urunTipi === "menu" ? {
        menuBurgerId: menuBurger?.id, menuBurgerAd: menuBurger?.ad,
        yanLezzetId: menuYanLezzet?.id, yanLezzetAd: menuYanLezzet?.ad,
        yanBoyutKodu: secilenYanBoyut?.kod, yanBoyutEtiketi: secilenYanBoyut?.etiket,
        yanBoyutMiktar: secilenYanBoyut?.miktar, yanBoyutBirim: secilenYanBoyut?.birim,
        icecekId: menuIcecek?.id, icecekAd: menuIcecek?.ad,
        icecekBoyutKodu: secilenIcecekBoyut?.kod, icecekBoyutEtiketi: secilenIcecekBoyut?.etiket,
        icecekBoyutMiktar: secilenIcecekBoyut?.miktar, icecekBoyutBirim: secilenIcecekBoyut?.birim,
      } : {}),
      ekstraMalzemeIdleri,
      ekstraMalzemeler: seciliEkstraMalzemeler.map((secenek) => ({ id: String(secenek.id), ad: secenek.ad, fiyat: Number(secenek.fiyat || 0) })),
    };
    for (let i = 0; i < adet; i++) {
      sepeteEkle({ ...urun, haricMalzemeler, secimler, gramajFiyatArtisi: toplamFiyatArtisi });
    }
    git(-1);
  };

  const oneriyiSepeteEkle = (onerilen) => {
    if (onerilen.ekstraMalzemeAyari?.aktif) {
      git(`/urun/${onerilen.id}`);
      return;
    }
    if (sepeteEkle(varsayilanSecimliUrunHazirla(onerilen, urunler))) {
      setEklenenOneriIdleri((onceki) => [...onceki, Number(onerilen.id)]);
    }
  };

  return (
    <div className="ekran urun-detay">
      <div className="urun-detay-govde">
        {/* Üst görsel — yukarıdan fade ile gelir */}
        <motion.div
          className="urun-detay-gorsel-wrap"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img className="urun-detay-gorsel" src={urun.gorsel} alt={urunAdi} />
          <button className="urun-detay-geri" onClick={() => git(-1)} aria-label={t("product.back")}>
            <IconBack />
          </button>
        </motion.div>

        <motion.div
          className="urun-detay-icerik"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          {/* Ad + fiyat + açıklama */}
          <section className="urun-detay-kart urun-detay-ozet">
            <h1 className="urun-detay-ad">{urunAdi}</h1>
            {indirim ? (
              <span className="urun-detay-fiyat-grup">
                <span className="urun-detay-fiyat-eski">₺{indirim.orijinalFiyat.toFixed(2)}</span>
                <span className="urun-detay-fiyat urun-detay-fiyat--indirim">₺{indirim.fiyat.toFixed(2)}</span>
              </span>
            ) : (
              <span className="urun-detay-fiyat">₺{urun.fiyat.toFixed(2)}</span>
            )}
            {urunAciklamasi && <p className="urun-detay-aciklama">{urunAciklamasi}</p>}
          </section>

          {miktarGoster && (
            <section className="urun-detay-kart gramaj-kart">
              <div className="gramaj-bilgi">
                <h2 className="urun-detay-baslik">{yerellestir(miktarAyari.etiket, null, null, `product.${gramajKaynagi.id}.amountLabel`) || t("product.amount")}</h2>
                <span className="gramaj-deger">
                  {toplamGramaj} {miktarAyari.birim}
                </span>
                {gramajOpsiyonu && <span className="gramaj-standart">{t("product.standard")}: {gramajKaynagi.temelMiktar} {miktarAyari.birim}{ekstraGramaj > 0 ? ` · +${ekstraGramaj} ${miktarAyari.birim}` : ""}</span>}
                {gramajOpsiyonu && <span className="gramaj-fiyat">{t("product.perIncrease", { amount: `${gramajOpsiyonu.artisMiktari} ${gramajOpsiyonu.birim}`, price: para(gramajOpsiyonu.fiyatArtisi) })}</span>}
              </div>
              {gramajOpsiyonu && <div className="gramaj-kontrol" aria-label={`${gramajOpsiyonu.etiket} seçimi`}>
                <button
                  type="button"
                  onClick={() => setGramajAdimi((a) => Math.max(0, a - 1))}
                  disabled={gramajAdimi === 0}
                  aria-label="Gramajı azalt"
                >
                  <IconMinus />
                </button>
                <span>{gramajAdimi}</span>
                <button
                  type="button"
                  onClick={() => setGramajAdimi((a) => Math.min(gramajOpsiyonu.maxAdim, a + 1))}
                  disabled={gramajAdimi === gramajOpsiyonu.maxAdim}
                  aria-label="Gramajı artır"
                >
                  <IconPlus />
                </button>
              </div>}
            </section>
          )}

          {["yan_lezzet", "icecek"].includes(urunTipi) && urun.boyutSecenekleri?.length > 0 && (
            <BoyutSecici baslik={t("product.sizeSelection")} urun={urun} seciliKod={tekUrunBoyut?.kod} onSec={setBoyutKodu} />
          )}

          {urunTipi === "menu" && menuYanLezzet && menuIcecek && (
            <>
              <section className="urun-detay-kart menu-icerik-ozeti">
                <h2 className="urun-detay-baslik">{t("product.menuContents")}</h2>
                <span><b>{yerellestir(menuBurger?.ad, menuBurger?.ceviriler, "ad", `product.${menuBurger?.id}.name`)}</b><small>Burger</small></span>
                <span><b>{yerellestir(menuYanLezzet.ad, menuYanLezzet.ceviriler, "ad", `product.${menuYanLezzet.id}.name`)}</b><small>{t("product.side")}</small></span>
                <span><b>{yerellestir(menuIcecek.ad, menuIcecek.ceviriler, "ad", `product.${menuIcecek.id}.name`)}</b><small>{t("product.drink")}</small></span>
              </section>
              <BoyutSecici baslik={t("product.sizeOf", { product: yerellestir(menuYanLezzet.ad, menuYanLezzet.ceviriler, "ad", `product.${menuYanLezzet.id}.name`) })} urun={menuYanLezzet} baslangicKodu={menuYapisi.varsayilanYanBoyut} seciliKod={secilenYanBoyut?.kod} onSec={setYanBoyutKodu} />
              <BoyutSecici baslik={t("product.sizeOf", { product: yerellestir(menuIcecek.ad, menuIcecek.ceviriler, "ad", `product.${menuIcecek.id}.name`) })} urun={menuIcecek} baslangicKodu={menuYapisi.varsayilanIcecekBoyut} seciliKod={secilenIcecekBoyut?.kod} onSec={setIcecekBoyutKodu} />
            </>
          )}

          {/* Besin değerleri — sıralı animasyonla gelir */}
          {urun.besinDegerleri && (
            <section className="urun-detay-kart">
              <h2 className="urun-detay-baslik">{t("product.nutrition")}</h2>
              <motion.div
                className="besin-grid"
                {...siraliKonteyner}
                initial="initial"
                animate="animate"
              >
                {besinEtiketleri.map(({ anahtar, etiket }) => (
                  <motion.div key={anahtar} className="besin-hucre" variants={siraliOge}>
                    <span className="besin-deger">{urun.besinDegerleri[anahtar]}</span>
                    <span className="besin-etiket">{dil === "en" ? ({ kalori: "Calories", protein: "Protein", karbonhidrat: "Carbs", yag: "Fat" }[anahtar]) : etiket}</span>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Alerjen bilgisi */}
          {urun.alerjenler && urun.alerjenler.length > 0 && (
            <section className="urun-detay-kart urun-detay-alerjen">
              <h2 className="urun-detay-baslik">{t("product.allergens")}</h2>
              <ul className="alerjen-liste">
                {urun.alerjenler.map((a, index) => (
                  <li key={a} className="alerjen-satir">
                    <IconWarning className="alerjen-ikon" aria-hidden="true" />
                    {yerellestir(a, null, null, `product.${urun.id}.allergen.${index}`)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* İçindekiler — tıklayınca çıkarılabilir malzeme özelleştirmesi */}
          {malzemeListesi.length > 0 && (
            <section className="urun-detay-kart">
              <h2 className="urun-detay-baslik">{t("product.ingredients")}</h2>
              <p className="urun-detay-malzeme-not">{t("product.tapToRemove")}</p>
              <div className="malzeme-liste">
                {malzemeListesi.map((m, index) => {
                  const haric = haricMalzemeler.includes(m);
                  return (
                    <motion.button
                      key={m}
                      type="button"
                      className={"malzeme-etiket " + (haric ? "malzeme--haric" : "malzeme--dahil")}
                      onClick={() => malzemeToggle(m)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="malzeme-ikon">{haric ? "✕" : "✓"}</span>
                      {yerellestir(m, null, null, `product.${gramajKaynagi.id}.ingredient.${index}`)}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          {ekstraMalzemeAyari && ekstraSecenekler.length > 0 && (
            <section className="urun-detay-kart ekstra-malzeme-secici">
              <div className="ekstra-malzeme-secici-baslik">
                <div><h2 className="urun-detay-baslik">{yerellestir(ekstraMalzemeAyari.baslik, null, null, `product.${urun.id}.extrasTitle`) || t("product.chooseExtras")}</h2><p>{t("product.selectionRange", { min: minimumEkstraSecimi > 0 ? (dil === "en" ? `At least ${minimumEkstraSecimi}, ` : `En az ${minimumEkstraSecimi}, `) : "", max: maksimumEkstraSecimi })}</p></div>
                <span>{ekstraMalzemeIdleri.length}/{maksimumEkstraSecimi}</span>
              </div>
              <div className="ekstra-malzeme-secenekleri">
                {ekstraSecenekler.map((secenek, index) => {
                  const secili = ekstraMalzemeIdleri.includes(String(secenek.id));
                  const siniraUlasti = !secili && ekstraMalzemeIdleri.length >= maksimumEkstraSecimi;
                  return <button type="button" key={secenek.id} className={secili ? "secili" : ""} disabled={siniraUlasti} onClick={() => ekstraMalzemeToggle(secenek.id)}>
                    <i aria-hidden="true">{secili ? "✓" : ""}</i><b>{yerellestir(secenek.ad, null, null, `product.${urun.id}.extra.${index}`)}</b><span>{Number(secenek.fiyat) > 0 ? `+${para(secenek.fiyat)}` : t("product.free")}</span>
                  </button>;
                })}
              </div>
              {ekstraSecimiEksik && <p className="ekstra-malzeme-zorunlu">{t("product.minimumRequired", { count: minimumEkstraSecimi })}</p>}
            </section>
          )}

          <AnimatePresence>
            {gorunenUrunOnerileri.length > 0 && (
              <motion.section
                className="urun-detay-kart urun-detay-oneri-bolumu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <span className="urun-detay-oneri-etiket">{t("product.pairsWell")}</span>
                <h2 className="urun-detay-baslik">{t("product.completeOrder")}</h2>
                <div className="urun-detay-oneri-listesi">
                  <AnimatePresence mode="popLayout">
                    {gorunenUrunOnerileri.map((onerilen) => (
                      <motion.article
                        layout
                        key={onerilen.id}
                        className="urun-detay-oneri"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, x: 18 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img src={onerilen.gorsel} alt="" />
                        <div className="urun-detay-oneri-bilgi">
                          <b>{yerellestir(onerilen.ad, onerilen.ceviriler, "ad", `product.${onerilen.id}.name`)}</b>
                          <small>₺{Number(onerilen.fiyat).toFixed(2)}</small>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => oneriyiSepeteEkle(onerilen)}
                          aria-label={`${onerilen.ad} sepete ekle`}
                          whileTap={{ scale: 0.88 }}
                        >
                          <IconPlus />
                          <span>{t("product.add")}</span>
                        </motion.button>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Alt sabit bar — adet seçici + sepete ekle */}
      <div className="urun-detay-alt-bar">
        <div className="adet-kontrol">
          <button onClick={() => setAdet((a) => Math.max(1, a - 1))} aria-label="Azalt">
            <IconMinus />
          </button>
          <span className="adet-sayi">{adet}</span>
          <button disabled={stoktaYok} onClick={() => setAdet((a) => a + 1)} aria-label="Artır">
            <IconPlus />
          </button>
        </div>
        <motion.button
          type="button"
          className="urun-detay-sepet-btn"
          disabled={stoktaYok || ekstraSecimiEksik}
          onClick={sepeteEkleyeBas}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {stoktaYok ? t("home.soldOut") : ekstraSecimiEksik ? t("product.chooseExtras") : t("product.addToCart", { price: para(birimFiyat * adet) })}
        </motion.button>
      </div>
    </div>
  );
}

function BoyutSecici({ baslik, urun, baslangicKodu, seciliKod, onSec }) {
  const { t, para, yerellestir } = useDil();
  const boyutlar = urun.boyutSecenekleri || [];
  const baslangicIndex = Math.max(0, boyutlar.findIndex((boyut) => boyut.kod === baslangicKodu || (!baslangicKodu && boyut.varsayilan)));
  const izinliBoyutlar = boyutlar.slice(baslangicIndex);
  const baslangicFiyati = Number(boyutlar[baslangicIndex]?.fiyatFarki || 0);
  return (
    <section className="urun-detay-kart boyut-secici">
      <h2 className="urun-detay-baslik">{baslik}</h2>
      <div className="boyut-secenekleri">
        {izinliBoyutlar.map((boyut, index) => {
          const fark = Number(boyut.fiyatFarki || 0) - baslangicFiyati;
          return <button type="button" key={boyut.kod} className={boyut.kod === seciliKod ? "aktif" : ""} onClick={() => onSec(boyut.kod)}><b>{yerellestir(boyut.etiket, null, null, `product.${urun.id}.size.${index}`)}</b><span>{boyut.miktar} {boyut.birim}</span><small>{fark > 0 ? `+${para(fark)}` : t("product.included")}</small></button>;
        })}
      </div>
    </section>
  );
}
