// ============================================================================
// Tanıtım sayfası etkileşimleri.
//
// Bilinçli olarak bağımlılıksızdır (motion kütüphanesi kullanılmaz): mobil
// menü ve SSS akordiyonu sayfanın temel işlevleridir, animasyon katmanı
// yüklenemese bile çalışmalıdır. Görsel süslemeler animasyonlar.js'te.
// ============================================================================

const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------------------------------------------------------------- Mobil menü */
function mobilMenu() {
  const dugme = document.getElementById("mobil-menu-dugmesi");
  const panel = document.getElementById("mobil-menu");
  if (!dugme || !panel) return;

  const acIkonu = dugme.querySelector(".mobil-menu-ikon-ac");
  const kapatIkonu = dugme.querySelector(".mobil-menu-ikon-kapat");

  function ayarla(acik) {
    panel.hidden = !acik;
    dugme.setAttribute("aria-expanded", String(acik));
    dugme.setAttribute("aria-label", acik ? "Menüyü kapat" : "Menüyü aç");
    acIkonu?.classList.toggle("hidden", acik);
    kapatIkonu?.classList.toggle("hidden", !acik);
  }

  const acikMi = () => dugme.getAttribute("aria-expanded") === "true";

  dugme.addEventListener("click", () => ayarla(!acikMi()));

  // Bir bağlantıya tıklanınca menü kapansın (aynı sayfa içi gezinme).
  panel.addEventListener("click", (olay) => {
    if (olay.target.closest("a")) ayarla(false);
  });

  // Escape kapatır ve odağı düğmeye geri verir.
  document.addEventListener("keydown", (olay) => {
    if (olay.key === "Escape" && acikMi()) {
      ayarla(false);
      dugme.focus();
    }
  });

  // Masaüstüne geçilince açık kalan panel gizlensin.
  const masaustu = window.matchMedia("(min-width: 768px)");
  const masaustuDegisti = (olay) => {
    if (olay.matches) ayarla(false);
  };
  masaustu.addEventListener("change", masaustuDegisti);

  ayarla(false);
}

/* ------------------------------------------------------------ SSS akordiyonu */
function sssAkordiyonu() {
  const liste = document.getElementById("sss-listesi");
  if (!liste) return;

  const dugmeler = Array.from(liste.querySelectorAll(".sss-dugme"));
  if (!dugmeler.length) return;

  function panelBul(dugme) {
    const id = dugme.getAttribute("aria-controls");
    return id ? document.getElementById(id) : null;
  }

  function ac(dugme, animasyonsuz = false) {
    const panel = panelBul(dugme);
    if (!panel) return;
    dugme.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    if (animasyonsuz || azHareket.matches || typeof panel.animate !== "function") return;
    panel.animate(
      [
        { height: "0px", opacity: 0 },
        { height: `${panel.scrollHeight}px`, opacity: 1 },
      ],
      { duration: 220, easing: "ease-out" },
    );
  }

  function kapat(dugme, animasyonsuz = false) {
    const panel = panelBul(dugme);
    if (!panel) return;
    dugme.setAttribute("aria-expanded", "false");
    if (animasyonsuz || azHareket.matches || typeof panel.animate !== "function") {
      panel.hidden = true;
      return;
    }
    const hareket = panel.animate(
      [
        { height: `${panel.scrollHeight}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: 180, easing: "ease-in" },
    );
    hareket.onfinish = () => {
      panel.hidden = true;
    };
  }

  dugmeler.forEach((dugme) => {
    dugme.addEventListener("click", () => {
      const acikti = dugme.getAttribute("aria-expanded") === "true";
      // Aynı anda tek soru açık kalsın (tasarımdaki davranış).
      dugmeler.forEach((digeri) => {
        if (digeri !== dugme) kapat(digeri);
      });
      if (acikti) kapat(dugme);
      else ac(dugme);
    });

    // Yukarı/aşağı ok ile sorular arasında gezinme.
    dugme.addEventListener("keydown", (olay) => {
      const yon = olay.key === "ArrowDown" ? 1 : olay.key === "ArrowUp" ? -1 : 0;
      if (!yon) return;
      olay.preventDefault();
      const sira = dugmeler.indexOf(dugme);
      dugmeler[(sira + yon + dugmeler.length) % dugmeler.length].focus();
    });
  });

  // Cevaplar HTML'de açık geliyor (JavaScript'siz okunabilsin diye).
  // Script çalıştığına göre akordiyona dönüştür: tasarımdaki gibi yalnızca
  // ilk soru açık kalsın. İlk kurulum animasyonsuz yapılır.
  dugmeler.forEach((dugme, sira) => {
    if (sira === 0) ac(dugme, true);
    else kapat(dugme, true);
  });
}

/* --------------------------------------------- Menüde aktif bölümü işaretleme */
function aktifBolumIsaretle() {
  const baglantilar = Array.from(document.querySelectorAll(".nav-baglanti"));
  if (!baglantilar.length || typeof IntersectionObserver !== "function") return;

  const eslesme = new Map();
  baglantilar.forEach((baglanti) => {
    const hedefId = baglanti.getAttribute("href") || "";
    if (!hedefId.startsWith("#") || hedefId.length < 2) return;
    const hedef = document.querySelector(hedefId);
    if (hedef) eslesme.set(hedef, baglanti);
  });
  if (!eslesme.size) return;

  function isaretle(aktifBaglanti) {
    baglantilar.forEach((baglanti) => {
      const aktif = baglanti === aktifBaglanti;
      baglanti.classList.toggle("text-white", aktif);
      baglanti.classList.toggle("text-marka-gri-300", !aktif);
      if (aktif) baglanti.setAttribute("aria-current", "true");
      else baglanti.removeAttribute("aria-current");
    });
  }

  const gozlemci = new IntersectionObserver(
    (girisler) => {
      const gorunen = girisler
        .filter((giris) => giris.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (gorunen) isaretle(eslesme.get(gorunen.target));
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
  );

  eslesme.forEach((_baglanti, hedef) => gozlemci.observe(hedef));
}

/* ------------------------------------------------------------------ Başlangıç */
mobilMenu();
sssAkordiyonu();
aktifBolumIsaretle();
