// Dört uygulamanın build çıktısını tek Vercel dağıtım klasöründe birleştirir.
//
//   apps/landing/dist    → dist/             (ana tanıtım sayfası)
//   apps/musteri/dist    → dist/uygulama/    (multi-tenant müşteri bundle'ı)
//   apps/personel/dist   → dist/personel/     (işletme/personel paneli)
//   apps/superadmin/dist → dist/super-admin/  (platform yönetimi)

import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const KOK = "dist";
const UYGULAMALAR = [
  { kaynak: "apps/landing/dist", hedef: KOK, ad: "Tanıtım sayfası" },
  { kaynak: "apps/musteri/dist", hedef: `${KOK}/uygulama`, ad: "Müşteri uygulaması" },
  { kaynak: "apps/personel/dist", hedef: `${KOK}/personel`, ad: "Personel uygulaması" },
  { kaynak: "apps/superadmin/dist", hedef: `${KOK}/super-admin`, ad: "Super admin uygulaması" },
];

async function birlestir() {
  if (existsSync(KOK)) await rm(KOK, { recursive: true, force: true });
  await mkdir(KOK, { recursive: true });

  for (const uygulama of UYGULAMALAR) {
    if (!existsSync(uygulama.kaynak)) {
      console.error(`HATA: ${uygulama.ad} build'i bulunamadı:`, uygulama.kaynak);
      process.exit(1);
    }
    await cp(uygulama.kaynak, uygulama.hedef, { recursive: true });
    console.log(`✓ ${uygulama.ad} → ${uygulama.hedef}/`);
  }

  console.log("\nBirleştirme tamamlandı. Yayına hazır: dist/");
}

birlestir().catch((hata) => {
  console.error("Birleştirme hatası:", hata);
  process.exit(1);
});
