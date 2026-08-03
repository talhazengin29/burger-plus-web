import { animate, hover, press, inView, scroll, stagger } from "motion";

const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const masaustuSorgu = window.matchMedia("(min-width: 768px)");
const masaustuMu = () => masaustuSorgu.matches;

const gorunecekler = Array.from(document.querySelectorAll(".fade-in-up"));

function dogrudanGoster() {
  gorunecekler.forEach((oge) => {
    oge.style.opacity = "1";
    oge.style.transform = "none";
  });
}

if (azHareket) {
  dogrudanGoster();
} else {
  baslat();
}

function baslat() {
  navGirisi();
  heroGirisi();
  heroKelimeGirisi();
  telefonMaketi3D();
  bildirimKartlariniDondur();
  sayacBaslat();
  zeminBloblariCanlandir();
  ilerlemeCubugu();
  bolumBasliklariniHarfleAyir();
  ozellikKartlari();
  konseptKartlari();
  fiyatKartlari();
  adimBolumu();
  butonMikroEtkilesimleri();
  navKaydirmaEtkileri();
  imlecTakibi();
  girisKartlari();
  footerGirisi();
  genelBolumGirisi();
}

/* ---------- Nav girişi ---------- */
function navGirisi() {
  const navigasyon = document.querySelector("nav");
  if (!navigasyon) return;
  animate(navigasyon, { opacity: [0, 1], y: [-18, 0] }, { duration: 0.55, ease: "easeOut" });
  animate(
    navigasyon.querySelectorAll("a, button"),
    { opacity: [0, 1], y: [-8, 0] },
    { duration: 0.4, delay: stagger(0.045, { startDelay: 0.12 }), ease: "easeOut" },
  );
}

/* ---------- 1. HERO ---------- */
function heroGirisi() {
  const heroSarici = document.querySelector("header .fade-in-up");
  if (!heroSarici) return;
  heroSarici.classList.remove("fade-in-up");
  heroSarici.style.opacity = "1";
  heroSarici.style.transform = "none";

  const sol = heroSarici.querySelector(":scope > div");
  if (!sol) return;
  const [rozet, , aciklama, butonlar, avatarSatiri] = Array.from(sol.children);
  if (rozet) {
    rozet.style.opacity = "0";
    animate(rozet, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, ease: "easeOut" });
  }
  const digerler = [aciklama, butonlar, avatarSatiri].filter(Boolean);
  digerler.forEach((el) => { el.style.opacity = "0"; });
  animate(
    digerler,
    { opacity: [0, 1], y: [22, 0] },
    { duration: 0.6, delay: stagger(0.1, { startDelay: 0.7 }), ease: [0.22, 1, 0.36, 1] },
  );
}

// Herhangi bir metin düğümünü, boşlukları koruyarak kelime span'larına böler.
function kelimeleriSar(kok, sinif) {
  const kelimeSpanlari = [];
  const walker = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT);
  const metinDugumleri = [];
  let n;
  while ((n = walker.nextNode())) metinDugumleri.push(n);

  metinDugumleri.forEach((dugum) => {
    const parcalar = dugum.textContent.split(/(\s+)/);
    const parent = dugum.parentNode;
    parcalar.forEach((parca) => {
      if (!parca) return;
      if (!parca.trim()) {
        parent.insertBefore(document.createTextNode(parca), dugum);
        return;
      }
      const span = document.createElement("span");
      span.className = sinif;
      span.style.display = "inline-block";
      span.style.opacity = "0";
      span.textContent = parca;
      parent.insertBefore(span, dugum);
      kelimeSpanlari.push(span);
    });
    parent.removeChild(dugum);
  });
  return kelimeSpanlari;
}

function heroKelimeGirisi() {
  const baslik = document.querySelector("header h1");
  if (!baslik) return;
  const tamMetin = baslik.textContent.replace(/\s+/g, " ").trim();
  const turuncuSpan = baslik.querySelector("span");

  const kelimeler = kelimeleriSar(baslik, "hero-kelime");
  baslik.setAttribute("aria-label", tamMetin);
  kelimeler.forEach((k) => k.setAttribute("aria-hidden", "true"));

  animate(
    kelimeler,
    { opacity: [0, 1], y: [30, 0], filter: ["blur(8px)", "blur(0px)"] },
    { delay: stagger(0.08, { startDelay: 0.15 }), duration: 0.6, ease: "easeOut" },
  );

  if (turuncuSpan) {
    const bekleme = 0.15 + kelimeler.length * 0.08 + 0.6 + 0.15;
    animate(
      turuncuSpan,
      { filter: ["brightness(1)", "brightness(1.7)", "brightness(1)"] },
      { duration: 0.55, repeat: 1, delay: bekleme, ease: "easeInOut" },
    );
  }
}

function telefonMaketi3D() {
  const kapsayici = document.querySelector("header .relative.w-full.flex.items-center.justify-center");
  const telefon = kapsayici?.querySelector(".glass-panel.rounded-\\[32px\\]");
  if (!kapsayici || !telefon) return;

  kapsayici.style.perspective = "1200px";
  telefon.style.willChange = "transform";
  telefon.style.opacity = "0";

  animate(
    telefon,
    { rotateY: [-15, 0], rotateX: [8, 0], opacity: [0, 1] },
    { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 },
  );

  inView(kapsayici, () => {
    const yuzme = animate(telefon, { y: [0, -12, 0] }, { duration: 4, repeat: Infinity, ease: "easeInOut" });
    return () => yuzme.stop();
  });

  if (masaustuMu()) {
    let bekliyor = false;
    kapsayici.addEventListener("mousemove", (e) => {
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(() => {
        bekliyor = false;
        const kutu = kapsayici.getBoundingClientRect();
        const oranX = (e.clientX - kutu.left) / kutu.width - 0.5;
        const oranY = (e.clientY - kutu.top) / kutu.height - 0.5;
        animate(telefon, { rotateY: oranX * 12, rotateX: -oranY * 12 }, { duration: 0.5, ease: "easeOut" });
      });
    });
    kapsayici.addEventListener("mouseleave", () => {
      animate(telefon, { rotateY: 0, rotateX: 0 }, { duration: 0.6, ease: "easeOut" });
    });
  }
}

function bildirimKartlariniDondur() {
  const kart = document.querySelector("header .absolute.bottom-10");
  if (!kart) return;
  kart.classList.remove("animate-bounce");
  const ikonKutusu = kart.querySelector(":scope > div:first-child");
  const ikonSpan = ikonKutusu?.querySelector("span");
  const metinler = kart.querySelectorAll("p");
  if (!ikonKutusu || !ikonSpan || metinler.length < 2) return;
  const [ustMetin, altMetin] = metinler;

  const bildirimler = [
    { ikon: "check_circle", renk: "text-green-400", arkaPlan: "bg-green-500/20", ust: "Yeni Sipariş", alt: "Masa 14 • ₺420" },
    { ikon: "restaurant", renk: "text-[#FF6B00]", arkaPlan: "bg-[#FF6B00]/20", ust: "Sipariş Hazır", alt: "Masa 7" },
    { ikon: "loyalty", renk: "text-yellow-400", arkaPlan: "bg-yellow-400/20", ust: "Sadakat Puanı", alt: "+150 Puan Kazanıldı" },
  ];

  let index = 0;
  let devamEt = false;
  let zamanlayiciId = null;

  const bekle = (ms) => new Promise((cozul) => { zamanlayiciId = setTimeout(cozul, ms); });

  async function goster() {
    const veri = bildirimler[index];
    ikonSpan.textContent = veri.ikon;
    ikonSpan.className = `material-symbols-outlined ${veri.renk}`;
    ikonKutusu.className = `w-12 h-12 rounded-full ${veri.arkaPlan} flex items-center justify-center`;
    ustMetin.textContent = veri.ust;
    altMetin.textContent = veri.alt;
    await animate(
      kart,
      { opacity: [0, 1], y: [16, 0], scale: [0.92, 1] },
      { type: "spring", stiffness: 300, damping: 22 },
    ).finished;
    index = (index + 1) % bildirimler.length;
  }

  async function dongu() {
    while (devamEt) {
      await goster();
      await bekle(3000);
      if (!devamEt) break;
      await animate(kart, { opacity: [1, 0], y: [0, -10] }, { duration: 0.35, ease: "easeIn" }).finished;
    }
  }

  inView(kart, () => {
    devamEt = true;
    dongu();
    return () => {
      devamEt = false;
      clearTimeout(zamanlayiciId);
    };
  });
}

function sayacBaslat() {
  const eleman = document.querySelector("header .text-white.font-bold");
  if (!eleman) return;
  let calisti = false;
  inView(eleman, () => {
    if (calisti) return;
    calisti = true;
    animate(0, 1000, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => {
        eleman.textContent = `${Math.round(v).toLocaleString("en-US")}+`;
      },
    });
  }, { amount: 0.8 });
}

/* ---------- Zemin bloblari ---------- */
function zeminBloblariCanlandir() {
  const bloblar = Array.from(document.querySelectorAll("body > div.pointer-events-none"));
  if (!bloblar.length) return;

  const ayarlar = [
    { sure: 22, gecikme: 0, x: 40, olcek: 1.15, paralaks: -150 },
    { sure: 27, gecikme: 2.5, x: -30, olcek: 1.12, paralaks: -90 },
  ];

  bloblar.forEach((blob, i) => {
    const a = ayarlar[i] || ayarlar[0];
    blob.style.willChange = "transform";
    let nefesKontrol = null;
    inView(document.body, () => {
      nefesKontrol = animate(
        blob,
        { x: [0, a.x, 0], scale: [1, a.olcek, 1] },
        { duration: a.sure, repeat: Infinity, ease: "easeInOut", delay: a.gecikme },
      );
      return () => nefesKontrol?.stop();
    }, { amount: 0 });
  });

  if (masaustuMu()) {
    bloblar.forEach((blob, i) => {
      const a = ayarlar[i] || ayarlar[0];
      const paralaksKontrol = animate(blob, { y: [0, a.paralaks] }, { ease: "linear" });
      paralaksKontrol.pause();
      scroll(paralaksKontrol);
    });
  }
}

/* ---------- 2. Kaydırma etkileri ---------- */
function ilerlemeCubugu() {
  const cubuk = document.createElement("div");
  cubuk.setAttribute("aria-hidden", "true");
  cubuk.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,#FF6B00,#FF8E3C);transform-origin:left;transform:scaleX(0);z-index:70;pointer-events:none;will-change:transform;";
  document.body.prepend(cubuk);
  scroll((ilerleme) => {
    cubuk.style.transform = `scaleX(${ilerleme})`;
  });
}

function harfSarmala(el) {
  const harfler = [];
  const metin = el.textContent;
  el.setAttribute("aria-label", metin);
  el.textContent = "";
  Array.from(metin).forEach((karakter) => {
    const span = document.createElement("span");
    span.textContent = karakter === " " ? " " : karakter;
    span.style.display = "inline-block";
    span.style.opacity = "0";
    span.setAttribute("aria-hidden", "true");
    el.appendChild(span);
    harfler.push(span);
  });
  return harfler;
}

function bolumBasliklariniHarfleAyir() {
  document.querySelectorAll("section h2").forEach((baslik) => {
    const sarici = baslik.closest(".fade-in-up");
    if (sarici) {
      sarici.classList.remove("fade-in-up");
      sarici.style.opacity = "1";
      sarici.style.transform = "none";
    }
    const aciklama = sarici?.querySelector(":scope > p") || null;
    if (aciklama) aciklama.style.opacity = "0";

    const harfler = harfSarmala(baslik);
    inView(baslik, () => {
      animate(harfler, { opacity: [0, 1], y: [14, 0] }, { delay: stagger(0.03), duration: 0.5, ease: "easeOut" });
      if (aciklama) {
        animate(aciklama, { opacity: [0, 1], y: [10, 0] }, { duration: 0.5, delay: 0.2, ease: "easeOut" });
      }
    }, { amount: 0.4 });
  });
}

/* ---------- 3. Kart animasyonlari ---------- */
function ozellikKartlari() {
  const kartlar = Array.from(document.querySelectorAll("#ozellikler .glass-panel.group"));
  if (!kartlar.length) return;
  const izgara = kartlar[0].parentElement;
  if (izgara) izgara.style.perspective = "1200px";

  kartlar.forEach((kart) => {
    kart.classList.remove("fade-in-up");
    kart.style.opacity = "0";
    kart.style.transform = "translateY(34px) scale(0.94)";
  });

  inView(document.getElementById("ozellikler"), () => {
    animate(
      kartlar,
      { opacity: [0, 1], y: [34, 0], scale: [0.94, 1] },
      { duration: 0.6, delay: stagger(0.08), ease: [0.22, 1, 0.36, 1] },
    );
  }, { amount: 0.15 });

  kartlar.forEach((kart) => {
    const ikonKutusu = kart.querySelector(".rounded-lg");
    if (masaustuMu()) {
      let bekliyor = false;
      kart.addEventListener("mousemove", (e) => {
        if (bekliyor) return;
        bekliyor = true;
        requestAnimationFrame(() => {
          bekliyor = false;
          const kutu = kart.getBoundingClientRect();
          const oranX = (e.clientX - kutu.left) / kutu.width - 0.5;
          const oranY = (e.clientY - kutu.top) / kutu.height - 0.5;
          animate(kart, { rotateY: oranX * 8, rotateX: -oranY * 8, y: -8 }, { duration: 0.4, ease: "easeOut" });
        });
      });
      kart.addEventListener("mouseleave", () => {
        animate(kart, { rotateY: 0, rotateX: 0, y: 0 }, { duration: 0.5, ease: "easeOut" });
      });
    }
    kart.addEventListener("mouseenter", () => {
      if (ikonKutusu) animate(ikonKutusu, { rotate: 360 }, { duration: 0.6, ease: "easeInOut" });
      kart.style.transition = "border-color .3s ease, box-shadow .3s ease";
      kart.style.borderColor = "rgba(255,107,0,0.5)";
      kart.style.boxShadow = "0 20px 45px -20px rgba(255,107,0,0.4)";
    });
    kart.addEventListener("mouseleave", () => {
      kart.style.borderColor = "";
      kart.style.boxShadow = "";
      if (ikonKutusu) animate(ikonKutusu, { rotate: 0 }, { duration: 0 });
    });
  });
}

function konseptKartlari() {
  const kartlar = Array.from(document.querySelectorAll(".relative.h-\\[400px\\].overflow-hidden.group"));
  if (!kartlar.length) return;

  kartlar.forEach((kart) => {
    kart.classList.remove("fade-in-up");
    kart.style.opacity = "0";
    kart.style.transform = "translateX(-40px) rotate(-2deg)";

    const panel = kart.querySelector(".glass-panel");
    if (panel && !panel.querySelector(".konsept-detay-link")) {
      const link = document.createElement("p");
      link.className = "konsept-detay-link font-body-md text-body-md";
      link.style.cssText =
        "color:#FF6B00;margin-top:6px;font-weight:700;opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .35s ease;";
      link.textContent = "Detayları Gör →";
      panel.appendChild(link);
    }
  });

  const bolum = kartlar[0].closest("section");
  if (bolum) {
    inView(bolum, () => {
      animate(
        kartlar,
        { opacity: [0, 1], x: [-40, 0], rotate: [-2, 0] },
        { duration: 0.65, delay: stagger(0.12), ease: [0.22, 1, 0.36, 1] },
      );
    }, { amount: 0.2 });
  }

  kartlar.forEach((kart) => {
    const link = kart.querySelector(".konsept-detay-link");
    if (!link) return;
    kart.addEventListener("mouseenter", () => {
      link.style.opacity = "1";
      link.style.transform = "translateY(0)";
    });
    kart.addEventListener("mouseleave", () => {
      link.style.opacity = "0";
      link.style.transform = "translateY(8px)";
    });
  });
}

function fiyatKartlari() {
  const kartlar = Array.from(document.querySelectorAll("#fiyatlandirma .glass-panel.flex.flex-col"));
  if (kartlar.length < 3) return;
  const [baslangic, populer] = kartlar;

  kartlar.forEach((kart) => {
    kart.classList.remove("fade-in-up");
    kart.style.opacity = "0";
    kart.style.transform = "translateY(34px)";
    Array.from(kart.querySelectorAll("li")).forEach((li) => {
      li.style.opacity = "0";
      li.style.transform = "translateY(8px)";
    });
  });

  inView(document.getElementById("fiyatlandirma"), () => {
    animate(
      kartlar,
      { opacity: [0, 1], y: [34, 0] },
      { duration: 0.6, delay: stagger(0.1), ease: [0.22, 1, 0.36, 1] },
    ).finished.then(() => {
      kartlar.forEach((kart, i) => {
        const oglar = Array.from(kart.querySelectorAll("li"));
        animate(
          oglar,
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.4, delay: stagger(0.05, { startDelay: i * 0.08 }), ease: "easeOut" },
        );
      });
      sayiSay(baslangic.querySelector(".text-display-lg"), 499, "₺");
      sayiSay(populer.querySelector(".text-display-lg"), 999, "₺");
    });
  }, { amount: 0.2 });

  inView(populer, () => {
    const nabiz = animate(populer, { scale: [1, 1.015, 1] }, { duration: 3, repeat: Infinity, ease: "easeInOut" });
    return () => nabiz.stop();
  });

  kartlar.forEach((kart) => {
    kart.addEventListener("mouseenter", () => {
      animate(kart, { y: -6 }, { duration: 0.25, ease: "easeOut" });
      kart.style.transition = "box-shadow .3s ease";
      kart.style.boxShadow = "0 25px 60px -20px rgba(255,107,0,0.4)";
    });
    kart.addEventListener("mouseleave", () => {
      animate(kart, { y: 0 }, { duration: 0.3, ease: "easeOut" });
      kart.style.boxShadow = "";
    });
  });
}

function sayiSay(el, hedef, onEk = "") {
  if (!el) return;
  animate(0, hedef, {
    duration: 1.5,
    ease: "easeOut",
    onUpdate: (v) => {
      el.textContent = `${onEk}${Math.round(v).toLocaleString("en-US")}`;
    },
  });
}

/* ---------- 4. Adimlar bolumu ---------- */
function adimBolumu() {
  const bolum = document.getElementById("nasil-calisir");
  if (!bolum) return;

  const sarici = bolum.querySelector(".fade-in-up");
  if (sarici) {
    sarici.classList.remove("fade-in-up");
    sarici.style.opacity = "1";
    sarici.style.transform = "none";
  }

  const cizgiKutusu = bolum.querySelector(".absolute.top-12");
  const cizgiDolu = cizgiKutusu?.querySelector(":scope > div");
  const daireler = Array.from(bolum.querySelectorAll(".w-24.h-24.rounded-full"));

  if (cizgiDolu) {
    cizgiDolu.style.transformOrigin = "left";
    cizgiDolu.style.transform = "scaleX(0)";
  }
  daireler.forEach((daire) => {
    daire.style.transform = "scale(0)";
    daire.style.position = "relative";
  });

  inView(bolum, () => {
    if (cizgiDolu) {
      animate(cizgiDolu, { scaleX: [0, 1] }, { duration: 1.2, ease: "easeInOut" });
    }
    daireler.forEach((daire, i) => {
      animate(
        daire,
        { scale: [0, 1.15, 1] },
        { type: "spring", stiffness: 260, damping: 16, delay: i * 0.35 },
      );
    });
  }, { amount: 0.3 });

  daireler.forEach((daire) => {
    daire.addEventListener("mouseenter", () => {
      const dalga = document.createElement("span");
      dalga.style.cssText =
        "position:absolute;inset:0;border-radius:9999px;border:2px solid #FF6B00;pointer-events:none;";
      daire.appendChild(dalga);
      animate(dalga, { scale: [1, 1.6], opacity: [0.8, 0] }, { duration: 0.7, ease: "easeOut" })
        .finished.then(() => dalga.remove())
        .catch(() => dalga.remove());
    });
  });
}

/* ---------- 5. Mikro etkilesimler ---------- */
function butonMikroEtkilesimleri() {
  const birincilButonlar = Array.from(document.querySelectorAll("a.btn-primary-glow"));
  const ikincilButonlar = Array.from(document.querySelectorAll("a.glass-panel[href]"));
  const hepsi = [...birincilButonlar, ...ikincilButonlar];
  if (!hepsi.length) return;

  hepsi.forEach((buton) => { buton.style.willChange = "transform"; });

  hover(hepsi, (buton) => {
    animate(buton, { scale: 1.04 }, { duration: 0.2, ease: "easeOut" });
    return () => animate(buton, { scale: 1 }, { duration: 0.25, ease: "easeOut" });
  });
  press(hepsi, (buton) => {
    animate(buton, { scale: 0.96 }, { duration: 0.12, ease: "easeOut" });
    return () => animate(buton, { scale: 1 }, { duration: 0.18, ease: "easeOut" });
  });

  birincilButonlar.forEach((buton) => {
    buton.style.position = buton.style.position || "relative";
    buton.style.overflow = "hidden";
    const isik = document.createElement("span");
    isik.setAttribute("aria-hidden", "true");
    isik.style.cssText =
      "position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);pointer-events:none;";
    buton.appendChild(isik);
    animate(isik, { x: "-150%" }, { duration: 0 });
    buton.addEventListener("mouseenter", () => {
      animate(isik, { x: ["-150%", "250%"] }, { duration: 0.65, ease: "easeInOut" });
    });
  });
}

function navKaydirmaEtkileri() {
  const nav = document.querySelector("nav");
  const navIcerik = nav?.querySelector(":scope > div");
  if (!nav || !navIcerik) return;

  navIcerik.style.transition = "height 0.3s ease";
  let kaydirilmisMi = false;
  scroll((_ilerleme, bilgi) => {
    const gerekli = bilgi.y.current > 40;
    if (gerekli === kaydirilmisMi) return;
    kaydirilmisMi = gerekli;
    navIcerik.style.height = gerekli ? "64px" : "";
  });

  const metinLinkleri = Array.from(document.querySelectorAll("nav .gap-lg.font-title-md > a"));
  metinLinkleri.forEach((link) => {
    link.style.position = "relative";
    const cizgi = document.createElement("span");
    cizgi.setAttribute("aria-hidden", "true");
    cizgi.style.cssText =
      "position:absolute;left:0;bottom:-4px;width:100%;height:2px;background:#FF6B00;transform:scaleX(0);transform-origin:left;pointer-events:none;";
    link.appendChild(cizgi);
    link.addEventListener("mouseenter", () => animate(cizgi, { scaleX: 1 }, { duration: 0.3, ease: "easeOut" }));
    link.addEventListener("mouseleave", () => animate(cizgi, { scaleX: 0 }, { duration: 0.3, ease: "easeOut" }));
  });

  const hedefIdler = metinLinkleri
    .map((a) => a.getAttribute("href"))
    .filter((href) => href && href.length > 1);
  hedefIdler.forEach((href) => {
    const hedef = document.querySelector(href);
    if (!hedef) return;
    inView(hedef, () => {
      metinLinkleri.forEach((link) => {
        link.style.color = link.getAttribute("href") === href ? "#FF6B00" : "";
      });
    }, { amount: 0.5 });
  });
}

function imlecTakibi() {
  if (!masaustuMu()) return;
  const hero = document.querySelector("header");
  if (!hero) return;
  hero.style.position = hero.style.position || "relative";

  const hale = document.createElement("div");
  hale.setAttribute("aria-hidden", "true");
  hale.style.cssText =
    "position:absolute;top:0;left:0;width:420px;height:420px;margin:-210px;border-radius:9999px;background:radial-gradient(circle,rgba(255,107,0,0.16),transparent 70%);filter:blur(10px);pointer-events:none;z-index:1;opacity:0;will-change:transform,opacity;transition:opacity .3s ease;";
  hero.appendChild(hale);

  let bekliyor = false;
  hero.addEventListener("mousemove", (e) => {
    if (bekliyor) return;
    bekliyor = true;
    requestAnimationFrame(() => {
      bekliyor = false;
      const kutu = hero.getBoundingClientRect();
      hale.style.transform = `translate(${e.clientX - kutu.left}px, ${e.clientY - kutu.top}px)`;
      hale.style.opacity = "1";
    });
  });
  hero.addEventListener("mouseleave", () => { hale.style.opacity = "0"; });
}

/* ---------- 6. Giris kartlari ---------- */
function girisKartlari() {
  const kartlar = Array.from(document.querySelectorAll("#giris a"));
  if (!kartlar.length) return;

  kartlar.forEach((kart) => {
    kart.style.opacity = "0";
    kart.style.transform = "translateY(24px)";

    const ikonKutusu = kart.querySelector(".rounded-full");
    const ikonSpan = ikonKutusu?.querySelector("span.material-symbols-outlined");
    if (ikonKutusu) {
      ikonKutusu.style.position = "relative";
      ikonKutusu.style.overflow = "hidden";
      const dolgu = document.createElement("span");
      dolgu.setAttribute("aria-hidden", "true");
      dolgu.style.cssText =
        "position:absolute;inset:0;background:#FF6B00;clip-path:inset(0 100% 0 0);transition:clip-path .45s ease;z-index:0;";
      ikonKutusu.insertBefore(dolgu, ikonKutusu.firstChild);
      if (ikonSpan) ikonSpan.style.position = "relative";

      kart.addEventListener("mouseenter", () => {
        animate(kart, { y: -6 }, { duration: 0.25, ease: "easeOut" });
        dolgu.style.clipPath = "inset(0 0% 0 0)";
        if (ikonSpan) animate(ikonSpan, { rotate: [0, -8, 8, 0] }, { duration: 0.5, ease: "easeInOut" });
      });
      kart.addEventListener("mouseleave", () => {
        animate(kart, { y: 0 }, { duration: 0.3, ease: "easeOut" });
        dolgu.style.clipPath = "inset(0 100% 0 0)";
      });
    }
  });

  const bolum = document.getElementById("giris");
  if (bolum) {
    inView(bolum, () => {
      animate(
        kartlar,
        { opacity: [0, 1], y: [24, 0] },
        { duration: 0.55, delay: stagger(0.1), ease: "easeOut" },
      );
    }, { amount: 0.3 });
  }
}

/* ---------- 7. Footer ---------- */
function footerGirisi() {
  const footer = document.querySelector("footer");
  const kolonlar = footer?.querySelector(".grid")?.children;
  if (!footer || !kolonlar?.length) return;

  Array.from(kolonlar).forEach((kolon) => {
    kolon.style.opacity = "0";
    kolon.style.transform = "translateX(-24px)";
  });

  inView(footer, () => {
    animate(
      Array.from(kolonlar),
      { opacity: [0, 1], x: [-24, 0] },
      { duration: 0.5, delay: stagger(0.1), ease: "easeOut" },
    );
  }, { amount: 0.2 });
}

/* ---------- Genel yedek: kalan .fade-in-up ogeleri ---------- */
function genelBolumGirisi() {
  document.querySelectorAll("section").forEach((bolum) => {
    const ogeler = Array.from(bolum.querySelectorAll(".fade-in-up"));
    if (!ogeler.length) return;
    inView(bolum, () => {
      animate(
        ogeler,
        { opacity: [0, 1], y: [34, 0], scale: [0.985, 1] },
        { duration: 0.62, delay: stagger(0.075), ease: [0.22, 1, 0.36, 1] },
      );
    }, { amount: 0.12, margin: "0px 0px -8% 0px" });
  });
}
