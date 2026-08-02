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

// Besin değerleri sabit sırayla gösterilir
const besinEtiketleri = [
  { anahtar: "kalori", etiket: "Kalori" },
  { anahtar: "protein", etiket: "Protein" },
  { anahtar: "karbonhidrat", etiket: "Karbonhidrat" },
  { anahtar: "yag", etiket: "Yağ" },
];

export default function UrunDetay() {
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
  const [eklenenOneriIdleri, setEklenenOneriIdleri] = useState([]);

  const urun = urunler.find((u) => String(u.id) === id);
  if (!urun) return <Navigate to={`/${isletmeSlug}/anasayfa`} replace />;
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
  const gramajOpsiyonu = gramajKaynagi.gramajOpsiyonu?.aktif ? gramajKaynagi.gramajOpsiyonu : null;
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
  const toplamFiyatArtisi = gramajFiyatArtisi + boyutFiyatArtisi;
  const birimFiyat = (indirim ? indirim.fiyat : urun.fiyat) + toplamFiyatArtisi;

  const malzemeToggle = (malzeme) => {
    setHaricMalzemeler((onceki) =>
      onceki.includes(malzeme)
        ? onceki.filter((m) => m !== malzeme) // tekrar tıkla → geri ekle
        : [...onceki, malzeme]                 // tıkla → çıkar
    );
  };

  const sepeteEkleyeBas = () => {
    const dahilMalzemeler = malzemeListesi.filter((m) => !haricMalzemeler.includes(m));
    const secimler = {
      dahilMalzemeler,
      haricMalzemeler,
      ...(gramajOpsiyonu ? {
        ekstraGramaj,
        standartGramaj: Number(gramajKaynagi.temelMiktar || 0),
        toplamGramaj,
        gramajEtiketi: gramajOpsiyonu.etiket,
        gramajBirim: gramajOpsiyonu.birim,
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
    };
    for (let i = 0; i < adet; i++) {
      sepeteEkle({ ...urun, haricMalzemeler, secimler, gramajFiyatArtisi: toplamFiyatArtisi });
    }
    git(-1);
  };

  const oneriyiSepeteEkle = (onerilen) => {
    sepeteEkle(varsayilanSecimliUrunHazirla(onerilen, urunler));
    setEklenenOneriIdleri((onceki) => [...onceki, Number(onerilen.id)]);
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
          <img className="urun-detay-gorsel" src={urun.gorsel} alt={urun.ad} />
          <button className="urun-detay-geri" onClick={() => git(-1)} aria-label="Geri">
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
            <h1 className="urun-detay-ad">{urun.ad}</h1>
            {indirim ? (
              <span className="urun-detay-fiyat-grup">
                <span className="urun-detay-fiyat-eski">₺{indirim.orijinalFiyat.toFixed(2)}</span>
                <span className="urun-detay-fiyat urun-detay-fiyat--indirim">₺{indirim.fiyat.toFixed(2)}</span>
              </span>
            ) : (
              <span className="urun-detay-fiyat">₺{urun.fiyat.toFixed(2)}</span>
            )}
            {urun.aciklama && <p className="urun-detay-aciklama">{urun.aciklama}</p>}
          </section>

          {gramajOpsiyonu && (
            <section className="urun-detay-kart gramaj-kart">
              <div className="gramaj-bilgi">
                <h2 className="urun-detay-baslik">{gramajOpsiyonu.etiket}</h2>
                <span className="gramaj-deger">
                  {toplamGramaj} {gramajOpsiyonu.birim}
                </span>
                <span className="gramaj-standart">Standart: {gramajKaynagi.temelMiktar} {gramajOpsiyonu.birim}{ekstraGramaj > 0 ? ` · +${ekstraGramaj} ${gramajOpsiyonu.birim}` : ""}</span>
                <span className="gramaj-fiyat">
                  Her +{gramajOpsiyonu.artisMiktari} {gramajOpsiyonu.birim} için +₺{gramajOpsiyonu.fiyatArtisi.toFixed(2)}
                </span>
              </div>
              <div className="gramaj-kontrol" aria-label={`${gramajOpsiyonu.etiket} seçimi`}>
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
              </div>
            </section>
          )}

          {["yan_lezzet", "icecek"].includes(urunTipi) && urun.boyutSecenekleri?.length > 0 && (
            <BoyutSecici baslik="Boyut seçimi" urun={urun} seciliKod={tekUrunBoyut?.kod} onSec={setBoyutKodu} />
          )}

          {urunTipi === "menu" && menuYanLezzet && menuIcecek && (
            <>
              <section className="urun-detay-kart menu-icerik-ozeti">
                <h2 className="urun-detay-baslik">Menü İçeriği</h2>
                <span><b>{menuBurger?.ad}</b><small>Burger</small></span>
                <span><b>{menuYanLezzet.ad}</b><small>Yan lezzet</small></span>
                <span><b>{menuIcecek.ad}</b><small>İçecek</small></span>
              </section>
              <BoyutSecici baslik={`${menuYanLezzet.ad} boyutu`} urun={menuYanLezzet} baslangicKodu={menuYapisi.varsayilanYanBoyut} seciliKod={secilenYanBoyut?.kod} onSec={setYanBoyutKodu} />
              <BoyutSecici baslik={`${menuIcecek.ad} boyutu`} urun={menuIcecek} baslangicKodu={menuYapisi.varsayilanIcecekBoyut} seciliKod={secilenIcecekBoyut?.kod} onSec={setIcecekBoyutKodu} />
            </>
          )}

          {/* Besin değerleri — sıralı animasyonla gelir */}
          {urun.besinDegerleri && (
            <section className="urun-detay-kart">
              <h2 className="urun-detay-baslik">Besin Değerleri</h2>
              <motion.div
                className="besin-grid"
                {...siraliKonteyner}
                initial="initial"
                animate="animate"
              >
                {besinEtiketleri.map(({ anahtar, etiket }) => (
                  <motion.div key={anahtar} className="besin-hucre" variants={siraliOge}>
                    <span className="besin-deger">{urun.besinDegerleri[anahtar]}</span>
                    <span className="besin-etiket">{etiket}</span>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Alerjen bilgisi */}
          {urun.alerjenler && urun.alerjenler.length > 0 && (
            <section className="urun-detay-kart urun-detay-alerjen">
              <h2 className="urun-detay-baslik">Alerjen Bilgisi</h2>
              <ul className="alerjen-liste">
                {urun.alerjenler.map((a) => (
                  <li key={a} className="alerjen-satir">
                    <IconWarning className="alerjen-ikon" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* İçindekiler — tıklayınca çıkarılabilir malzeme özelleştirmesi */}
          {malzemeListesi.length > 0 && (
            <section className="urun-detay-kart">
              <h2 className="urun-detay-baslik">İçindekiler</h2>
              <p className="urun-detay-malzeme-not">İstemediğin malzemeye dokun</p>
              <div className="malzeme-liste">
                {malzemeListesi.map((m) => {
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
                      {m}
                    </motion.button>
                  );
                })}
              </div>
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
                <span className="urun-detay-oneri-etiket">YANINDA İYİ GİDER</span>
                <h2 className="urun-detay-baslik">Siparişini tamamla</h2>
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
                          <b>{onerilen.ad}</b>
                          <small>₺{Number(onerilen.fiyat).toFixed(2)}</small>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => oneriyiSepeteEkle(onerilen)}
                          aria-label={`${onerilen.ad} sepete ekle`}
                          whileTap={{ scale: 0.88 }}
                        >
                          <IconPlus />
                          <span>Ekle</span>
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
          <button onClick={() => setAdet((a) => a + 1)} aria-label="Artır">
            <IconPlus />
          </button>
        </div>
        <motion.button
          type="button"
          className="urun-detay-sepet-btn"
          onClick={sepeteEkleyeBas}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {`Sepete Ekle — ₺${(birimFiyat * adet).toFixed(2)}`}
        </motion.button>
      </div>
    </div>
  );
}

function BoyutSecici({ baslik, urun, baslangicKodu, seciliKod, onSec }) {
  const boyutlar = urun.boyutSecenekleri || [];
  const baslangicIndex = Math.max(0, boyutlar.findIndex((boyut) => boyut.kod === baslangicKodu || (!baslangicKodu && boyut.varsayilan)));
  const izinliBoyutlar = boyutlar.slice(baslangicIndex);
  const baslangicFiyati = Number(boyutlar[baslangicIndex]?.fiyatFarki || 0);
  return (
    <section className="urun-detay-kart boyut-secici">
      <h2 className="urun-detay-baslik">{baslik}</h2>
      <div className="boyut-secenekleri">
        {izinliBoyutlar.map((boyut) => {
          const fark = Number(boyut.fiyatFarki || 0) - baslangicFiyati;
          return <button type="button" key={boyut.kod} className={boyut.kod === seciliKod ? "aktif" : ""} onClick={() => onSec(boyut.kod)}><b>{boyut.etiket}</b><span>{boyut.miktar} {boyut.birim}</span><small>{fark > 0 ? `+₺${fark.toFixed(2)}` : "Dahil"}</small></button>;
        })}
      </div>
    </section>
  );
}
