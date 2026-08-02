// ============================================================================
// İki uygulamanın build çıktısını tek klasörde birleştirir.
//
//   apps/musteri/dist   →  dist/            (kök: müşteri uygulaması)
//   apps/personel/dist  →  dist/personel/   (alt yol: personel paneli)
//   apps/superadmin/dist → dist/super-admin/ (platform yönetimi)
//
// Sonuç: tek Vercel projesi, tek adres.
//   siteniz.vercel.app          → müşteri
//   siteniz.vercel.app/personel → personel
//   siteniz.vercel.app/super-admin → super admin
// ============================================================================

import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const KOK = "dist";
const MUSTERI = "apps/musteri/dist";
const PERSONEL = "apps/personel/dist";
const SUPER_ADMIN = "apps/superadmin/dist";

async function birlestir() {
  // Eski çıktıyı temizle
  if (existsSync(KOK)) await rm(KOK, { recursive: true, force: true });
  await mkdir(KOK, { recursive: true });

  // 1) Müşteri uygulaması → kök
  if (!existsSync(MUSTERI)) {
    console.error("HATA: Müşteri build'i bulunamadı:", MUSTERI);
    process.exit(1);
  }
  await cp(MUSTERI, KOK, { recursive: true });
  console.log("✓ Müşteri uygulaması → dist/");

  // 2) Personel uygulaması → dist/personel
  if (!existsSync(PERSONEL)) {
    console.error("HATA: Personel build'i bulunamadı:", PERSONEL);
    process.exit(1);
  }
  await cp(PERSONEL, `${KOK}/personel`, { recursive: true });
  console.log("✓ Personel uygulaması → dist/personel/");

  // 3) Super admin uygulaması → dist/super-admin
  if (!existsSync(SUPER_ADMIN)) {
    console.error("HATA: Super admin build'i bulunamadı:", SUPER_ADMIN);
    process.exit(1);
  }
  await cp(SUPER_ADMIN, `${KOK}/super-admin`, { recursive: true });
  console.log("✓ Super admin uygulaması → dist/super-admin/");

  console.log("\nBirleştirme tamamlandı. Yayına hazır: dist/");
}

birlestir().catch((e) => {
  console.error("Birleştirme hatası:", e);
  process.exit(1);
});
