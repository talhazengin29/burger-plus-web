import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useSuruklenebilir } from "../hooks/useSuruklenebilir";
import { IconPlus, IconSearch, IconFilter } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import { siraliKonteyner, siraliOge, barDolumu, asagiAcilma } from "../lib/animasyonlar";
import { guvenliMetin } from "../lib/dogrulama";
import { useTema } from "../context/TemaContext";
import "./Home.css";

// Arama çubuğundaki filtre düğmesinin sıralama seçenekleri
const siralamalar = [
  { id: "onerilen", etiket: "Önerilen" },
  { id: "artan", etiket: "Fiyat: Artan" },
  { id: "azalan", etiket: "Fiyat: Azalan" },
];

function sayfaYenilendiMi() {
  if (typeof window === "undefined") return false;
  return window.performance?.getEntriesByType?.("navigation")?.[0]?.type === "reload";
}

export default function Home() {
  const { metinler } = useTema();
  const location = useLocation();
  // Kampanyalar'dan "Sipariş Ver" ile gelinirse ilgili kategori otomatik seçili açılır.
  // Tarayıcı yenilemesinde history state geri gelse bile menü her zaman Tümü'nden başlar.
  const [aktifKategori, setAktifKategori] = useState(
    sayfaYenilendiMi() ? "Tümü" : (location.state?.kategori || "Tümü")
  );
  const [arama, setArama] = useState("");
  const [siralama, setSiralama] = useState("onerilen");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const { sepeteEkle, burgerDamga, burgerDamgaHedef, misafir, indirimliFiyat, urunler, kategoriler } = useApp();
  const git = useIsletmeNavigate();
  const chipRef = useSuruklenebilir();

  useEffect(() => {
    if (kategoriler.some((kategori) => kategori.ad === aktifKategori)) return;
    setAktifKategori(kategoriler.find((kategori) => kategori.ad === "Tümü")?.ad || kategoriler[0]?.ad || "Tümü");
  }, [aktifKategori, kategoriler]);

  // Kategori + arama + sıralama; hepsi yalnızca listelemeyi etkiler
  const gosterilen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const liste = urunler.filter(
      (u) =>
        (aktifKategori === "Tümü" || u.kategori === aktifKategori) &&
        (q === "" || u.ad.toLocaleLowerCase("tr").includes(q))
    );
    if (siralama === "artan") return [...liste].sort((a, b) => a.fiyat - b.fiyat);
    if (siralama === "azalan") return [...liste].sort((a, b) => b.fiyat - a.fiyat);
    return liste;
  }, [aktifKategori, arama, siralama, urunler]);

  const damgaYuzde = (burgerDamga / burgerDamgaHedef) * 100;
  const populerUrunler = gosterilen.filter((urun) => urun.populer === true).slice(0, 4);
  const digerUrunler = gosterilen.filter((urun) => urun.populer !== true);
  const kategoriBasligi = aktifKategori === "Tümü" ? "Ürünler" : aktifKategori;
  const sloganVurguIndex = metinler.slogan.lastIndexOf(metinler.sloganVurgu);
  const sloganBaslangici = sloganVurguIndex >= 0 ? metinler.slogan.slice(0, sloganVurguIndex).trim() : metinler.slogan;
  const damgaMetni = metinler.damgaMetni.replace("{hedef}", burgerDamgaHedef);
  const [damgaBaslangici, ...damgaVurgusu] = damgaMetni.split(/,\s*/);

  return (
    <div className="ekran home">
      <OrtakHeader selamlama />

      <div className="home-govde">
        {/* Kahraman başlık */}
        <motion.h1
          className="home-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {sloganBaslangici}
          {sloganVurguIndex >= 0 && <><br /><span className="vurgu">{metinler.sloganVurgu}</span></>}
        </motion.h1>

        {/* Ye Kazan damga kartı */}
        <motion.section
          className="damga-kart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
        >
          <div className="damga-ust">
            <div>
              <span className="damga-rozet">{metinler.kampanyaBaslik}</span>
              <h2 className="damga-baslik">
                {damgaBaslangici}{damgaVurgusu.length > 0 && <>, <span className="vurgu">{damgaVurgusu.join(", ")}</span></>}
              </h2>
            </div>
            {!misafir && (
              <span className="damga-sayac">
                {burgerDamga}
                <span className="damga-sayac-hedef">/{burgerDamgaHedef}</span>
              </span>
            )}
          </div>

          {misafir ? (
            <p className="damga-misafir-not">
              Giriş yap veya üye ol, bu kampanyaya dahil ol!
            </p>
          ) : (
            <>
              <div className="ilerleme-ray">
                {/* Bar dolumu animasyonu — açılışta 0'dan yüzdeye kadar dolar */}
                <motion.div className="ilerleme-dolgu" {...barDolumu(damgaYuzde)} />
              </div>
              <span className="damga-durum">
                {burgerDamgaHedef - burgerDamga} {metinler.damgaBirim.toLocaleLowerCase("tr")} sonra hediyen hazır
              </span>
            </>
          )}
        </motion.section>

        {/* Kategoriler — yuvarlak görseller, yatay kaydırma */}
        <div className="kategori-satir" ref={chipRef}>
          {kategoriler.map((kategori) => {
            const k = kategori.ad;
            return (
            <motion.button
              key={kategori.id || k}
              type="button"
              className={"kategori" + (k === aktifKategori ? " kategori--aktif" : "")}
              onClick={() => setAktifKategori(k)}
              aria-pressed={k === aktifKategori}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="kategori-daire">
                {kategori.gorsel && (
                  <img className="kategori-gorsel" src={kategori.gorsel} alt="" loading="lazy" />
                )}
              </span>
              <span className="kategori-ad">{k}</span>
            </motion.button>
            );
          })}
        </div>

        {/* Arama çubuğu — cam, solda arama ikonu, sağda sıralama filtresi */}
        <motion.div
          className="arama-sarici"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        >
          <div className="arama-kutu">
            <IconSearch className="arama-ikon" aria-hidden="true" />
            <input
              className="arama-input"
              type="search"
              value={arama}
              onChange={(e) => setArama(guvenliMetin(e.target.value, 80))}
              placeholder={metinler.aramaPlaceholder}
              aria-label={metinler.aramaPlaceholder}
              maxLength="80"
            />
            <motion.button
              type="button"
              className={"filtre-btn" + (filtreAcik ? " filtre-btn--acik" : "")}
              onClick={() => setFiltreAcik((v) => !v)}
              aria-label="Sıralama seçenekleri"
              aria-expanded={filtreAcik}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <IconFilter className="filtre-ikon" />
            </motion.button>
          </div>

          <AnimatePresence>
            {filtreAcik && (
              <>
                {/* Dışarı tıklayınca menü kapansın */}
                <button
                  type="button"
                  className="filtre-perde"
                  aria-label="Sıralama menüsünü kapat"
                  onClick={() => setFiltreAcik(false)}
                />
                <motion.div className="filtre-menu" {...asagiAcilma}>
                  {siralamalar.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={"filtre-secenek" + (siralama === s.id ? " filtre-secenek--aktif" : "")}
                      onClick={() => {
                        setSiralama(s.id);
                        setFiltreAcik(false);
                      }}
                    >
                      {s.etiket}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Kategoriye göre öne çıkan ilk beş ürün — yatay kaydırılabilir. */}
        {populerUrunler.length > 0 && <div className="bolum-satir">
          <h3 className="bolum-baslik">{aktifKategori === "Tümü" ? metinler.urunBolumBaslik : `${metinler.urunBolumBaslik}: ${kategoriBasligi}`}</h3>
        </div>}

        {/* Popüler ürünler — kategori değişince yeniden sıralanır. */}
        {populerUrunler.length > 0 && <AnimatePresence mode="wait">
          <motion.div
            className="populer-urun-listesi"
            key={`populer-${aktifKategori}-${siralama}-${arama}`}
            {...siraliKonteyner}
            initial="initial"
            animate="animate"
          >
            {populerUrunler.map((u) => {
              const indirim = indirimliFiyat(u);
              return <UrunKarti key={u.id} urun={u} indirim={indirim} git={git} sepeteEkle={sepeteEkle} />;
            })}
          </motion.div>
        </AnimatePresence>}

        {digerUrunler.length > 0 && (
          <section className="diger-urunler">
            <div className="bolum-satir diger-urunler-baslik"><h3 className="bolum-baslik">Tüm {kategoriBasligi}</h3><small>{digerUrunler.length} ürün</small></div>
            <AnimatePresence mode="wait">
              <motion.div className="urun-grid" key={`diger-${aktifKategori}-${siralama}-${arama}`} {...siraliKonteyner} initial="initial" animate="animate">
                {digerUrunler.map((u) => <UrunKarti key={u.id} urun={u} indirim={indirimliFiyat(u)} git={git} sepeteEkle={sepeteEkle} />)}
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {gosterilen.length === 0 && (
          <p className="bos-sonuc">{arama ? `“${arama}” için sonuç bulunamadı.` : "Menü ürünleri yönetim panelinden eklenmeyi bekliyor."}</p>
        )}
      </div>
    </div>
  );
}

function UrunKarti({ urun, indirim, git, sepeteEkle }) {
  const standartBoyut = urun.boyutSecenekleri?.find((boyut) => boyut.varsayilan) || urun.boyutSecenekleri?.[0];
  return <motion.article className="urun-kart" variants={siraliOge} onClick={() => git(`/urun/${urun.id}`)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") git(`/urun/${urun.id}`); }}>
    <div className="urun-gorsel-wrap"><img className="urun-gorsel" src={urun.gorsel} alt={urun.ad} loading="lazy" /></div>
    <div className="urun-alt"><h4 className="urun-ad">{urun.ad}</h4>{urun.temelMiktar > 0 && <span className="urun-standart-miktar">Standart {urun.temelMiktar} {urun.gramajOpsiyonu?.birim || "gr"}</span>}{standartBoyut && <span className="urun-standart-miktar">Standart {standartBoyut.etiket} · {standartBoyut.miktar} {standartBoyut.birim}</span>}<div className="urun-fiyat-satir">{indirim ? <span className="urun-fiyat-grup"><span className="urun-fiyat-eski">₺{indirim.orijinalFiyat.toFixed(2)}</span><span className="urun-fiyat urun-fiyat--indirim">₺{indirim.fiyat.toFixed(2)}</span></span> : <span className="urun-fiyat">₺{urun.fiyat.toFixed(2)}</span>}<motion.button className="ekle-btn" onClick={(e) => { e.stopPropagation(); if (urun.urunTipi === "menu" || standartBoyut) git(`/urun/${urun.id}`); else sepeteEkle(urun); }} aria-label={`${urun.ad} sepete ekle`} whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}><IconPlus className="ekle-ikon" /></motion.button></div></div>
  </motion.article>;
}
