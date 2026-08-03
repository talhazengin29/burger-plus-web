const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const TOKEN_ANAHTARI = "bp_super_admin_token";

export const superToken = {
  al: () => sessionStorage.getItem(TOKEN_ANAHTARI),
  kaydet: (token) => sessionStorage.setItem(TOKEN_ANAHTARI, token),
  sil: () => sessionStorage.removeItem(TOKEN_ANAHTARI),
};

async function jsonOku(yanit) {
  const tip = yanit.headers.get("content-type") || "";
  if (!tip.includes("application/json")) {
    await yanit.text().catch(() => "");
    throw new Error(`Sunucu geçersiz yanıt döndürdü (HTTP ${yanit.status}).`);
  }
  return yanit.json();
}

export async function superIstek(yol, secenekler = {}, kimlikGerekli = true) {
  const headers = new Headers(secenekler.headers || {});
  if (secenekler.body && !(secenekler.body instanceof Blob) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = superToken.al();
  if (kimlikGerekli && token) headers.set("Authorization", `Bearer ${token}`);
  const yanit = await fetch(`${BACKEND_URL}/api/super${yol}`, { ...secenekler, headers });
  const veri = await jsonOku(yanit).catch((hata) => ({ hata: hata.message }));
  if (!yanit.ok) {
    if ([401, 403].includes(yanit.status) && kimlikGerekli) {
      superToken.sil();
      window.dispatchEvent(new CustomEvent("super-admin-oturum-bitti"));
    }
    const hata = new Error(veri.hata || `İstek tamamlanamadı (HTTP ${yanit.status}).`);
    hata.status = yanit.status;
    hata.veri = veri;
    throw hata;
  }
  return veri;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const superGiris = (email, sifre) => superIstek("/giris", json("POST", { email, sifre }), false);
export const superIkiFaktor = (ikiFaktorToken, kod) => superIstek("/giris/iki-faktor", json("POST", { ikiFaktorToken, kod }), false);
export const superBen = () => superIstek("/ben");
export const superCikis = () => superIstek("/cikis", { method: "POST" });
export const ozetGetir = () => superIstek("/ozet");
export const isletmeleriGetir = () => superIstek("/isletmeler");
export const isletmeGetir = (id) => superIstek(`/isletmeler/${id}`);
export const isletmeOlustur = (veri) => superIstek("/isletmeler", json("POST", veri));
export const kurulumTamamla = (veri) => superIstek("/isletmeler/kurulum", json("POST", veri));
export const sablonGetir = (konsept) => superIstek(`/sablonlar/${encodeURIComponent(konsept)}`);
export const slugKontrol = (slug) => superIstek(`/slug-kontrol?slug=${encodeURIComponent(slug)}`);
export const isletmeGuncelle = (id, veri) => superIstek(`/isletmeler/${id}`, json("PUT", veri));
export const isletmeDurumuDegistir = (id, aktif) => superIstek(`/isletmeler/${id}/durum`, json("PATCH", { aktif }));
export const isletmeSil = (id, onaySlug) => superIstek(`/isletmeler/${id}`, json("DELETE", { onaySlug }));
export const erisimTokeniOlustur = (id) => superIstek(`/isletmeler/${id}/erisim-tokeni`, { method: "POST" });
export const isletmeAdminleriniGetir = (id) => superIstek(`/isletmeler/${id}/admin`);
export const isletmeAdminiKaydet = (id, veri) => superIstek(`/isletmeler/${id}/admin`, json("POST", veri));
function raporSorgusu(aralik = 30) {
  const sorgu = new URLSearchParams();
  if (typeof aralik === "object" && aralik) {
    if (aralik.baslangic) sorgu.set("baslangic", aralik.baslangic);
    if (aralik.bitis) sorgu.set("bitis", aralik.bitis);
  } else sorgu.set("gun", String(aralik || 30));
  return sorgu.toString();
}
export const ciroRaporu = (aralik = 30) => superIstek(`/rapor/ciro?${raporSorgusu(aralik)}`);
export const siparisRaporu = (aralik = 30) => superIstek(`/rapor/siparis?${raporSorgusu(aralik)}`);
export const buyumeRaporu = (ay = 12) => superIstek(`/rapor/buyume?ay=${encodeURIComponent(ay)}`);
export const kullaniciRaporu = (aralik = null) => superIstek(`/rapor/kullanici${aralik && typeof aralik === "object" ? `?${raporSorgusu(aralik)}` : ""}`);
export const abonelikleriGetir = () => superIstek("/abonelikler");
export const abonelikOlustur = (veri) => superIstek("/abonelikler", json("POST", veri));
export const abonelikGuncelle = (id, veri) => superIstek(`/abonelikler/${id}`, json("PUT", veri));
export const gelirRaporu = (ay = 12) => superIstek(`/gelir?ay=${encodeURIComponent(ay)}`);
export const kayitlariGetir = (filtre = {}) => {
  const sorgu = new URLSearchParams();
  Object.entries(filtre).forEach(([anahtar, deger]) => deger != null && deger !== "" && sorgu.set(anahtar, deger));
  return superIstek(`/kayitlar?${sorgu}`);
};

export function personelPanelineGit(token) {
  const temel = String(import.meta.env.VITE_PERSONEL_URL || `${window.location.origin}/personel`).replace(/\/$/, "");
  window.location.assign(`${temel}?erisim=${encodeURIComponent(token)}`);
}
