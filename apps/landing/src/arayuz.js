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

/* --------------------------------------------------------- Tema anahtarı (koyu/aydınlık) */
const TEMA_ANAHTARI = "bp-landing-tema";

function temaAnahtari() {
  const dugme = document.getElementById("tema-anahtari-dugmesi");
  if (!dugme) return;

  const ayIkon = dugme.querySelector(".tema-ikon-ay");
  const gunesIkon = dugme.querySelector(".tema-ikon-gunes");
  const metaRenk = document.querySelector('meta[name="theme-color"]');

  function uygula(koyu) {
    document.documentElement.classList.toggle("dark", koyu);
    ayIkon?.classList.toggle("hidden", !koyu);
    gunesIkon?.classList.toggle("hidden", koyu);
    dugme.setAttribute("aria-label", koyu ? "Aydınlık temaya geç" : "Koyu temaya geç");
    if (metaRenk) metaRenk.setAttribute("content", koyu ? "#0f1015" : "#f7f7f8");
  }

  // Sayfa index.html'deki başlangıç scriptiyle zaten doğru class'ta açılıyor;
  // burada sadece ikon/aria durumunu ona eşitliyoruz.
  uygula(document.documentElement.classList.contains("dark"));

  dugme.addEventListener("click", () => {
    const yeniKoyu = !document.documentElement.classList.contains("dark");
    uygula(yeniKoyu);
    try {
      localStorage.setItem(TEMA_ANAHTARI, yeniKoyu ? "dark" : "light");
    } catch {
      /* localStorage erişilemiyor (gizli sekme vb.) — sessizce geç */
    }
  });
}

/* --------------------------------------------------- Fiyat anahtarı (aylık/yıllık) */
function fiyatAnahtari() {
  const grup = document.getElementById("fiyat-anahtari");
  if (!grup) return;

  const dugmeler = Array.from(grup.querySelectorAll(".fiyat-anahtar-dugme"));
  if (!dugmeler.length) return;

  function uygula(periyot) {
    dugmeler.forEach((dugme) => {
      const aktif = dugme.dataset.periyot === periyot;
      dugme.setAttribute("aria-pressed", String(aktif));
      dugme.classList.toggle("fiyat-anahtar-dugme--aktif", aktif);
    });
    document.querySelectorAll(".fiyat-aylik-blok").forEach((el) => el.classList.toggle("hidden", periyot !== "aylik"));
    document.querySelectorAll(".fiyat-yillik-blok").forEach((el) => el.classList.toggle("hidden", periyot !== "yillik"));
  }

  dugmeler.forEach((dugme) => dugme.addEventListener("click", () => uygula(dugme.dataset.periyot)));
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
      baglanti.classList.toggle("text-marka-metin", aktif);
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

/* ------------------------------------------------------------- Talep formu */
// Form gönderimi tamamen istemci tarafındadır: alanlar doğrulanır, tek bir
// mesaja çevrilir ve WhatsApp'a (yoksa e-postaya) aktarılır. Hiçbir veri
// saklanmaz veya üçüncü bir sunucuya iletilmez — bu yüzden formun backend'e
// ihtiyacı yoktur.
function talepFormu() {
  const form = document.getElementById("talep-formu");
  if (!form) return; // İletişim kanalı tanımlı değilse form basılmamıştır.

  const durum = document.getElementById("talep-durum");
  const kanal = form.dataset.kanal || "whatsapp";
  const hedef = form.dataset.hedef || "";

  const hataKutusu = (ad) => document.getElementById(`talep-${ad}-hata`);

  function hataGoster(ad, mesaj) {
    const kutu = hataKutusu(ad);
    const girdi = form.elements[ad];
    if (kutu) {
      kutu.textContent = mesaj;
      kutu.hidden = false;
    }
    if (girdi) {
      girdi.setAttribute("aria-invalid", "true");
      girdi.classList.add("talep-girdi--hatali");
    }
  }

  function hatayiTemizle(ad) {
    const kutu = hataKutusu(ad);
    const girdi = form.elements[ad];
    if (kutu) {
      kutu.textContent = "";
      kutu.hidden = true;
    }
    if (girdi) {
      girdi.removeAttribute("aria-invalid");
      girdi.classList.remove("talep-girdi--hatali");
    }
  }

  // Türkiye cep/sabit hat: 10 hane (başında 0 veya +90 olabilir).
  function telefonGecerliMi(deger) {
    const rakamlar = String(deger).replace(/\D/g, "");
    return /^(90)?0?\d{10}$/.test(rakamlar);
  }

  function epostaGecerliMi(deger) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(deger).trim());
  }

  function dogrula() {
    const hatalar = [];
    ["ad", "isletme", "telefon"].forEach((ad) => {
      const deger = String(form.elements[ad]?.value || "").trim();
      if (!deger) {
        hataGoster(ad, "Bu alan zorunludur.");
        hatalar.push(ad);
      } else {
        hatayiTemizle(ad);
      }
    });

    const telefon = String(form.elements.telefon?.value || "").trim();
    if (telefon && !telefonGecerliMi(telefon)) {
      hataGoster("telefon", "Geçerli bir telefon numarası girin (örn. 0532 111 22 33).");
      if (!hatalar.includes("telefon")) hatalar.push("telefon");
    }

    const eposta = String(form.elements.eposta?.value || "").trim();
    if (eposta && !epostaGecerliMi(eposta)) {
      hataGoster("eposta", "Geçerli bir e-posta adresi girin.");
      hatalar.push("eposta");
    } else if (eposta) {
      hatayiTemizle("eposta");
    }

    // E-posta kanalında dönüş adresi olmadan talep işe yaramaz.
    if (kanal === "eposta" && !eposta) {
      hataGoster("eposta", "E-posta ile gönderimde bu alan zorunludur.");
      hatalar.push("eposta");
    }

    const kvkk = form.elements.kvkk;
    const kvkkHatasi = document.getElementById("talep-kvkk-hata");
    if (kvkk && !kvkk.checked) {
      if (kvkkHatasi) {
        kvkkHatasi.textContent = "Devam etmek için aydınlatma metnini onaylayın.";
        kvkkHatasi.hidden = false;
      }
      kvkk.setAttribute("aria-invalid", "true");
      hatalar.push("kvkk");
    } else if (kvkkHatasi) {
      kvkkHatasi.textContent = "";
      kvkkHatasi.hidden = true;
      kvkk?.removeAttribute("aria-invalid");
    }

    return hatalar;
  }

  function mesajiKur() {
    const oku = (ad) => String(form.elements[ad]?.value || "").trim();
    const satirlar = [
      "Merhaba, QR Menü Pro için kurulum talebim var.",
      "",
      `Ad Soyad: ${oku("ad")}`,
      `İşletme: ${oku("isletme")}`,
      `Telefon: ${oku("telefon")}`,
    ];
    if (oku("eposta")) satirlar.push(`E-posta: ${oku("eposta")}`);
    if (oku("masaSayisi")) satirlar.push(`Masa sayısı: ${oku("masaSayisi")}`);
    if (oku("paket")) satirlar.push(`İlgilenilen paket: ${oku("paket")}`);
    if (oku("mesaj")) satirlar.push("", `Not: ${oku("mesaj")}`);
    return satirlar.join("\n");
  }

  form.addEventListener("submit", (olay) => {
    olay.preventDefault();
    const hatalar = dogrula();

    if (hatalar.length) {
      if (durum) durum.textContent = "Lütfen işaretli alanları kontrol edin.";
      const ilk = form.elements[hatalar[0]];
      ilk?.focus();
      return;
    }

    const mesaj = mesajiKur();
    const adres =
      kanal === "whatsapp"
        ? `https://wa.me/${hedef}?text=${encodeURIComponent(mesaj)}`
        : `mailto:${hedef}?subject=${encodeURIComponent("QR Menü Pro — Kurulum talebi")}&body=${encodeURIComponent(mesaj)}`;

    if (durum) {
      durum.textContent =
        kanal === "whatsapp"
          ? "WhatsApp açılıyor — mesajı göndermeyi unutmayın."
          : "E-posta uygulamanız açılıyor — mesajı göndermeyi unutmayın.";
    }

    // WhatsApp yeni sekmede, mailto aynı sekmede açılır (mailto yeni sekmede
    // boş bir pencere bırakır).
    if (kanal === "whatsapp") window.open(adres, "_blank", "noopener,noreferrer");
    else window.location.href = adres;
  });

  // Kullanıcı düzeltmeye başlayınca hata mesajı kaybolsun.
  ["ad", "isletme", "telefon", "eposta"].forEach((ad) => {
    form.elements[ad]?.addEventListener("input", () => hatayiTemizle(ad));
  });

  // Fiyat kartlarındaki butonlar tıklanan paketi formda önceden seçtirir.
  document.querySelectorAll("a[data-paket]").forEach((baglanti) => {
    baglanti.addEventListener("click", () => {
      const secim = form.elements.paket;
      if (!secim) return;
      const istenen = baglanti.dataset.paket;
      const uygun = Array.from(secim.options).some((secenek) => secenek.value === istenen);
      if (uygun) secim.value = istenen;
    });
  });
}

/* ------------------------------------------------------------------ Başlangıç */
mobilMenu();
sssAkordiyonu();
temaAnahtari();
fiyatAnahtari();
aktifBolumIsaretle();
talepFormu();
