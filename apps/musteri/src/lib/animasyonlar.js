/*
  Burger Plus — Animasyon Ayarları
  Tüm animasyonlar buradan beslenir → tek yerden değiştirilebilir, tutarlı kalır.

  Felsefe: sıcak, iştah açıcı, hızlı ama abartısız.
  - Sayfa geçişleri: yumuşak fade + hafif kayma (200ms)
  - Kartlar: aşağıdan gelir, sıralı (stagger)
  - Butonlar: tıklama hissi (küçülme), hover'da hafif büyüme
  - Özel: sepete eklerken zıplama, puan kazanınca parlama
*/

// --- Sayfa geçişleri ---
export const sayfaGecisi = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" },
};

// --- Kart / liste öğeleri (aşağıdan gelir, sıralı) ---
export const kartGirisi = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
};

// Sıralı animasyon (her kart biraz gecikmeli gelir)
export const siraliKonteyner = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const siraliOge = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// --- Buton etkileşimleri ---
export const butonTiklama = {
  whileTap: { scale: 0.93 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

export const butonHover = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

// --- Sepete ekleme efekti (zıplama) ---
export const sepeteEkleEfekti = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.25, 1], transition: { duration: 0.3 } },
};

// --- Badge (sayı rozeti) pop efekti ---
export const badgePop = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: "spring", stiffness: 500, damping: 15 },
};

// --- Ye Kazan bar dolumu ---
export const barDolumu = (yuzde) => ({
  initial: { width: "0%" },
  animate: { width: `${yuzde}%` },
  transition: { duration: 0.8, ease: "easeOut", delay: 0.3 },
});

// --- Fade in (basit) ---
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25 },
};

// --- Yukarıdan aşağı açılma (dropdown/modal) ---
export const asagiAcilma = {
  initial: { opacity: 0, y: -10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.97 },
  transition: { duration: 0.2, ease: "easeOut" },
};
