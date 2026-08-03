// ============================================================================
// Tanıtım sayfası animasyonları (motion kütüphanesi).
//
// Kural: içerik HTML'de GÖRÜNÜR başlar. Gizleme yalnızca burada, JS çalışırken
// yapılır. Böylece script yüklenmezse veya hata alırsa sayfa yine okunur kalır.
// Temel işlevler (mobil menü, SSS) bu dosyaya bağlı değildir → arayuz.js.
// ============================================================================

import { animate, hover, inView, press, scroll, stagger } from "motion";

const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const masaustuMu = () => window.matchMedia("(min-width: 768px)").matches;
const YUMUSAK = [0.22, 1, 0.36, 1];

if (!azHareket) baslat();

function baslat() {
  ustBarGirisi();
  heroGirisi();
  panelMaketi();
  zeminHaleleri();
  ilerlemeCubugu();
  bolumBasliklari();
  kartlariCanlandir(".ozellik-kart", "#ozellikler");
  kartlariCanlandir(".adim-kart", "#nasil-calisir");
  // Yorum kartları kayan şeritte; giriş animasyonu uygulanmıyor. Aksi halde
  // kartlar opacity 0'a alınıp tek tek belirirken şerit çoktan akmaya başlıyor
  // ve kopya küme ile asıl küme farklı zamanlarda görünüyordu.
  paketKartlari();
  sssGirisi();
  altbilgiGirisi();
  ozellikKartiEtkilesimi();
  butonMikroEtkilesimleri();
  kartIsigiTakibi();
  miknatisliButonlar();
  ustBarKaydirmaDurumu();
}

/* ------------------------------------------------------------------ Üst bar */
function ustBarGirisi() {
  const ustBar = document.querySelector("header");
  if (!ustBar) return;
  animate(ustBar, { opacity: [0, 1], y: [-18, 0] }, { duration: 0.5, ease: "easeOut" });
}

/* --------------------------------------------------------------------- Hero */
// Başlığı kelime parçalarına ayırır.
//
// ÖNEMLİ: Yalnızca doğrudan metin düğümleri bölünür; <span class="metin-gradyan">
// gibi element çocuklar OLDUĞU GİBİ bırakılır. Gradyanlı metin
// background-image + background-clip:text ile çiziliyor ve background miras
// alınmadığı için içerideki metin yeni bir span'a taşınırsa görünmez olur.
function heroParcalariniAyir(baslik, sinif) {
  const parcalar = [];

  Array.from(baslik.childNodes).forEach((dugum) => {
    if (dugum.nodeType === Node.ELEMENT_NODE) {
      if (dugum.tagName === "BR") return; // satır sonu animasyona girmez
      dugum.style.display = "inline-block";
      dugum.style.opacity = "0";
      parcalar.push(dugum);
      return;
    }
    if (dugum.nodeType !== Node.TEXT_NODE) return;

    dugum.textContent.split(/(\s+)/).forEach((parca) => {
      if (!parca) return;
      if (!parca.trim()) {
        baslik.insertBefore(document.createTextNode(parca), dugum);
        return;
      }
      const span = document.createElement("span");
      span.className = sinif;
      span.style.display = "inline-block";
      span.style.opacity = "0";
      span.textContent = parca;
      baslik.insertBefore(span, dugum);
      parcalar.push(span);
    });
    baslik.removeChild(dugum);
  });

  return parcalar;
}

function heroGirisi() {
  const baslik = document.querySelector(".hero-baslik");
  if (baslik) {
    const tamMetin = baslik.textContent.replace(/\s+/g, " ").trim();
    const kelimeler = heroParcalariniAyir(baslik, "hero-kelime");
    // Bölünmüş metin ekran okuyucuya parça parça okunmasın.
    baslik.setAttribute("aria-label", tamMetin);
    kelimeler.forEach((kelime) => kelime.setAttribute("aria-hidden", "true"));
    animate(
      kelimeler,
      { opacity: [0, 1], y: [28, 0], filter: ["blur(8px)", "blur(0px)"] },
      { duration: 0.6, delay: stagger(0.07, { startDelay: 0.1 }), ease: "easeOut" },
    );
  }

  const digerleri = [
    document.querySelector(".hero-rozet"),
    document.querySelector(".hero-aciklama"),
    document.querySelector(".hero-butonlar"),
  ].filter(Boolean);
  if (!digerleri.length) return;
  digerleri.forEach((oge) => {
    oge.style.opacity = "0";
  });
  animate(
    digerleri,
    { opacity: [0, 1], y: [22, 0] },
    { duration: 0.6, delay: stagger(0.12, { startDelay: 0.5 }), ease: YUMUSAK },
  );
}

/* ------------------------------------------------------------ Panel maketi */
function panelMaketi() {
  const maket = document.querySelector(".panel-maket");
  if (!maket) return;

  const kapsayici = maket.parentElement;
  if (kapsayici) kapsayici.style.perspective = "1400px";
  maket.style.opacity = "0";
  maket.style.willChange = "transform";

  animate(
    maket,
    { opacity: [0, 1], y: [48, 0], rotateX: [10, 0], scale: [0.97, 1] },
    { duration: 0.9, delay: 0.35, ease: YUMUSAK },
  );

  // Masaüstünde imlece göre hafif eğilme.
  if (!masaustuMu()) return;
  let bekliyor = false;
  maket.addEventListener("mousemove", (olay) => {
    if (bekliyor) return;
    bekliyor = true;
    requestAnimationFrame(() => {
      bekliyor = false;
      const kutu = maket.getBoundingClientRect();
      const oranX = (olay.clientX - kutu.left) / kutu.width - 0.5;
      const oranY = (olay.clientY - kutu.top) / kutu.height - 0.5;
      animate(maket, { rotateY: oranX * 5, rotateX: -oranY * 5 }, { duration: 0.5, ease: "easeOut" });
    });
  });
  maket.addEventListener("mouseleave", () => {
    animate(maket, { rotateY: 0, rotateX: 0 }, { duration: 0.6, ease: "easeOut" });
  });
}

/* ------------------------------------------------------------ Zemin ışıkları */
function zeminHaleleri() {
  const haleler = Array.from(document.querySelectorAll(".hale"));
  if (!haleler.length) return;

  const ayarlar = [
    { sure: 22, gecikme: 0, x: 40, olcek: 1.15, paralaks: -140 },
    { sure: 27, gecikme: 2.5, x: -30, olcek: 1.12, paralaks: -90 },
    { sure: 25, gecikme: 1.2, x: 34, olcek: 1.1, paralaks: -110 },
    { sure: 30, gecikme: 3, x: -26, olcek: 1.14, paralaks: -70 },
  ];

  haleler.forEach((hale, sira) => {
    const ayar = ayarlar[sira % ayarlar.length];
    hale.style.willChange = "transform";
    animate(
      hale,
      { x: [0, ayar.x, 0], scale: [1, ayar.olcek, 1] },
      { duration: ayar.sure, repeat: Infinity, ease: "easeInOut", delay: ayar.gecikme },
    );

    if (!masaustuMu()) return;
    const paralaks = animate(hale, { y: [0, ayar.paralaks] }, { ease: "linear" });
    paralaks.pause();
    scroll(paralaks);
  });
}

/* -------------------------------------------------------- Kaydırma göstergesi */
function ilerlemeCubugu() {
  const cubuk = document.createElement("div");
  cubuk.setAttribute("aria-hidden", "true");
  cubuk.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,#ff8a3d,#ff6b00);transform-origin:left;transform:scaleX(0);z-index:70;pointer-events:none;will-change:transform;";
  document.body.prepend(cubuk);
  scroll((ilerleme) => {
    cubuk.style.transform = `scaleX(${ilerleme})`;
  });
}

/* ---------------------------------------------------------- Bölüm başlıkları */
function bolumBasliklari() {
  document.querySelectorAll(".bolum-basligi").forEach((sarici) => {
    const ogeler = Array.from(sarici.children);
    if (!ogeler.length) return;
    ogeler.forEach((oge) => {
      oge.style.opacity = "0";
    });
    inView(
      sarici,
      () => {
        animate(
          ogeler,
          { opacity: [0, 1], y: [20, 0] },
          { duration: 0.55, delay: stagger(0.09), ease: "easeOut" },
        );
      },
      { amount: 0.4 },
    );
  });
}

/* ------------------------------------------------------------- Kart girişleri */
function kartlariCanlandir(kartSecici, bolumSecici) {
  const bolum = document.querySelector(bolumSecici);
  const kartlar = Array.from(document.querySelectorAll(kartSecici));
  if (!bolum || !kartlar.length) return;

  kartlar.forEach((kart) => {
    kart.style.opacity = "0";
  });

  inView(
    bolum,
    () => {
      animate(
        kartlar,
        { opacity: [0, 1], y: [34, 0], scale: [0.96, 1] },
        { duration: 0.6, delay: stagger(0.08), ease: YUMUSAK },
      );
    },
    { amount: 0.15 },
  );
}

function paketKartlari() {
  const bolum = document.getElementById("fiyatlandirma");
  const kartlar = Array.from(document.querySelectorAll(".paket-kart"));
  if (!bolum || !kartlar.length) return;

  kartlar.forEach((kart) => {
    kart.style.opacity = "0";
    Array.from(kart.querySelectorAll("li")).forEach((madde) => {
      madde.style.opacity = "0";
    });
  });

  inView(
    bolum,
    () => {
      animate(kartlar, { opacity: [0, 1], y: [34, 0] }, { duration: 0.6, delay: stagger(0.1), ease: YUMUSAK })
        .finished.then(() => {
          kartlar.forEach((kart, sira) => {
            animate(
              Array.from(kart.querySelectorAll("li")),
              { opacity: [0, 1], y: [8, 0] },
              { duration: 0.35, delay: stagger(0.05, { startDelay: sira * 0.06 }), ease: "easeOut" },
            );
          });
        })
        .catch(() => {
          // Animasyon yarıda kesilirse maddeler yine de görünsün.
          kartlar.forEach((kart) =>
            kart.querySelectorAll("li").forEach((madde) => {
              madde.style.opacity = "1";
            }),
          );
        });
    },
    { amount: 0.2 },
  );

  // Öne çıkan paketin nefes alan halesi CSS'te (.nefes-hale) — burada tekrar
  // animasyon kurulmuyor ki iki efekt üst üste binmesin.
}

function sssGirisi() {
  const liste = document.getElementById("sss-listesi");
  if (!liste) return;
  const satirlar = Array.from(liste.children);
  if (!satirlar.length) return;
  satirlar.forEach((satir) => {
    satir.style.opacity = "0";
  });
  inView(
    liste,
    () => {
      animate(satirlar, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, delay: stagger(0.06), ease: "easeOut" });
    },
    { amount: 0.1 },
  );
}

function altbilgiGirisi() {
  const altbilgi = document.querySelector("footer");
  const kolonlar = altbilgi ? Array.from(altbilgi.firstElementChild?.children || []) : [];
  if (!kolonlar.length) return;
  kolonlar.forEach((kolon) => {
    kolon.style.opacity = "0";
  });
  inView(
    altbilgi,
    () => {
      animate(kolonlar, { opacity: [0, 1], y: [18, 0] }, { duration: 0.5, delay: stagger(0.1), ease: "easeOut" });
    },
    { amount: 0.2 },
  );
}

/* ----------------------------------------------------------- Mikro etkileşim */
function ozellikKartiEtkilesimi() {
  if (!masaustuMu()) return;
  document.querySelectorAll(".ozellik-kart").forEach((kart) => {
    const ikon = kart.querySelector(".ozellik-ikon");
    kart.addEventListener("mouseenter", () => {
      animate(kart, { y: -8 }, { duration: 0.28, ease: "easeOut" });
      if (ikon) animate(ikon, { rotate: [0, 8, 0] }, { duration: 0.5, ease: "easeInOut" });
    });
    kart.addEventListener("mouseleave", () => {
      animate(kart, { y: 0 }, { duration: 0.32, ease: "easeOut" });
    });
  });
}

/* -------------------------------------------- İmleci takip eden kart ışığı */
// CSS (.isik-kart::after) ışığı --fare-x/--fare-y değişkenlerinden okur;
// burada yalnızca imleç konumunu yazıyoruz. Dokunmatik cihazlarda hover
// olmadığı için hiç bağlanmıyoruz.
function kartIsigiTakibi() {
  if (!window.matchMedia("(hover: hover)").matches) return;
  const kartlar = Array.from(document.querySelectorAll(".isik-kart"));
  if (!kartlar.length) return;

  kartlar.forEach((kart) => {
    let bekliyor = false;
    kart.addEventListener("pointermove", (olay) => {
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(() => {
        bekliyor = false;
        const kutu = kart.getBoundingClientRect();
        kart.style.setProperty("--fare-x", `${olay.clientX - kutu.left}px`);
        kart.style.setProperty("--fare-y", `${olay.clientY - kutu.top}px`);
      });
    });
  });
}

/* ------------------------------------------------------ Mıknatıslı butonlar */
// İmleç yaklaşınca buton hafifçe ona doğru kayar. Kayma 6 pikselle sınırlı:
// fark edilir ama tıklama hedefini kaçırtacak kadar değil.
//
// Bilerek motion yerine CSS'in ayrı `translate` özelliği kullanılıyor:
// butonun scale animasyonu `transform` üzerinden gidiyor, ikisi aynı
// özelliği paylaşsaydı birbirini eziyor olurdu.
function miknatisliButonlar() {
  if (!masaustuMu() || !window.matchMedia("(hover: hover)").matches) return;
  const EN_FAZLA = 6;

  document.querySelectorAll("a.marka-buton").forEach((buton) => {
    let bekliyor = false;
    buton.addEventListener("pointermove", (olay) => {
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(() => {
        bekliyor = false;
        const kutu = buton.getBoundingClientRect();
        const oranX = (olay.clientX - kutu.left) / kutu.width - 0.5;
        const oranY = (olay.clientY - kutu.top) / kutu.height - 0.5;
        buton.style.translate = `${(oranX * EN_FAZLA * 2).toFixed(2)}px ${(oranY * EN_FAZLA).toFixed(2)}px`;
      });
    });
    buton.addEventListener("pointerleave", () => {
      buton.style.translate = "0px 0px";
    });
  });
}

/* ------------------------------------------------ Üst barın kaydırma durumu */
function ustBarKaydirmaDurumu() {
  const ustBar = document.querySelector(".ustbar");
  if (!ustBar) return;
  let kaydirildi = false;
  scroll((_ilerleme, bilgi) => {
    const gerekli = bilgi.y.current > 40;
    if (gerekli === kaydirildi) return;
    kaydirildi = gerekli;
    ustBar.classList.toggle("ustbar--kaydirildi", gerekli);
  });
}

function butonMikroEtkilesimleri() {
  const butonlar = Array.from(document.querySelectorAll("a.marka-buton"));
  if (!butonlar.length) return;

  butonlar.forEach((buton) => {
    buton.style.willChange = "transform";
  });

  hover(butonlar, (buton) => {
    animate(buton, { scale: 1.04 }, { duration: 0.2, ease: "easeOut" });
    return () => animate(buton, { scale: 1 }, { duration: 0.25, ease: "easeOut" });
  });
  press(butonlar, (buton) => {
    animate(buton, { scale: 0.96 }, { duration: 0.12, ease: "easeOut" });
    return () => animate(buton, { scale: 1 }, { duration: 0.18, ease: "easeOut" });
  });

  // Üzerine gelince soldan sağa geçen ışık.
  butonlar.forEach((buton) => {
    buton.style.position = buton.style.position || "relative";
    buton.style.overflow = "hidden";
    const isik = document.createElement("span");
    isik.setAttribute("aria-hidden", "true");
    isik.style.cssText =
      "position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);pointer-events:none;transform:translateX(-150%);";
    buton.appendChild(isik);
    buton.addEventListener("mouseenter", () => {
      animate(isik, { x: ["-150%", "250%"] }, { duration: 0.65, ease: "easeInOut" });
    });
  });
}
