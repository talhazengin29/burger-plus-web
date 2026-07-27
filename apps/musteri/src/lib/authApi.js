/* ==========================================================================
   Backend auth API'sine baglanan yardimci fonksiyonlar.
   Token localStorage'da tutulur (oturum kalici).
   ========================================================================== */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const TOKEN_ANAHTARI = "bp_token";

// Beni hatırla: true → localStorage (kalıcı), false → sessionStorage (sekme kapanınca gider)
export function tokeniKaydet(token, hatirla = true) {
  if (hatirla) {
    localStorage.setItem(TOKEN_ANAHTARI, token);
    sessionStorage.removeItem(TOKEN_ANAHTARI);
  } else {
    sessionStorage.setItem(TOKEN_ANAHTARI, token);
    localStorage.removeItem(TOKEN_ANAHTARI);
  }
}
export function tokeniAl() {
  // Önce kalıcı (localStorage), yoksa oturumluk (sessionStorage)
  return localStorage.getItem(TOKEN_ANAHTARI) || sessionStorage.getItem(TOKEN_ANAHTARI);
}
export function tokeniSil() {
  localStorage.removeItem(TOKEN_ANAHTARI);
  sessionStorage.removeItem(TOKEN_ANAHTARI);
}

// Kayit ol
export async function kayitOl(veri) {
  const r = await fetch(`${BACKEND_URL}/api/kayit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(veri),
  });
  return r.json();
}

// Giris yap
export async function girisYap(email, sifre) {
  const r = await fetch(`${BACKEND_URL}/api/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sifre }),
  });
  return r.json();
}

// Token ile guncel kullanici bilgisi (sayfa yenilenince oturum korunur)
export async function beniGetir() {
  const token = tokeniAl();
  if (!token) return null;
  const r = await fetch(`${BACKEND_URL}/api/ben`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.kullanici;
}

// Puani sunucuda guncelle (giris yapmis kullanici icin)
export async function puaniGuncelle(puan) {
  const token = tokeniAl();
  if (!token) return;
  await fetch(`${BACKEND_URL}/api/puan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ puan }),
  });
}

// Profil guncelle (email + telefon)
export async function profilGuncelle(email, telefon) {
  const token = tokeniAl();
  if (!token) return { hata: "Giriş gerekli." };
  const r = await fetch(`${BACKEND_URL}/api/profil`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, telefon }),
  });
  return r.json();
}
