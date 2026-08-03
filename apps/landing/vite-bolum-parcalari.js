// ============================================================================
// Yerel Vite eklentisi — HTML bölüm parçaları (component) desteği.
//
// Tanıtım sayfası React kullanmıyor; bu eklenti sayede sayfa yine de ayrı
// component dosyalarına bölünebiliyor ve çıktı statik HTML olarak kalıyor
// (SEO için önemli). Hiçbir yeni npm bağımlılığı gerektirmez.
//
// Kullanım:
//   index.html içinde   <!-- parca: hero -->        → bolumler/hero.html
//   herhangi bir parçada {{ markaAdi }}             → src/icerik.js değeri
//   herhangi bir parçada {{ paketKartlariHtml }}    → src/icerik.js fonksiyonu
//
// Değişken çözümü: önce src/icerik.js'in dışa aktardıkları (nokta ile alt
// alanlar da desteklenir), sonra ICERIK nesnesi. Bulunamayan bir anahtar
// sessizce boş bırakılmaz — build hata verir; böylece yazım hatası gözden
// kaçmaz.
// ============================================================================

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PARCA_DESENI = /<!--\s*parca:\s*([\w-]+)\s*-->/g;
const DEGISKEN_DESENI = /\{\{\s*([\w.$]+)\s*\}\}/g;
const EN_FAZLA_DERINLIK = 5;

function alanaGit(kok, yol) {
  return yol.split(".").reduce((deger, parca) => (deger == null ? undefined : deger[parca]), kok);
}

export default function bolumParcalari({
  parcaDizini = "bolumler",
  icerikDosyasi = "src/icerik.js",
} = {}) {
  let kokDizin = process.cwd();

  const parcaYolu = (ad) => path.resolve(kokDizin, parcaDizini, `${ad}.html`);
  const icerikYolu = () => path.resolve(kokDizin, icerikDosyasi);

  // Her derlemede taze modül: sorgu parametresi Node'un ESM önbelleğini atlatır.
  async function icerigiYukle() {
    return import(`${pathToFileURL(icerikYolu()).href}?t=${Date.now()}`);
  }

  function degiskenleriDoldur(html, modul, kaynak) {
    return html.replace(DEGISKEN_DESENI, (tamEslesme, anahtar) => {
      let deger = alanaGit(modul, anahtar);
      if (deger === undefined) deger = alanaGit(modul.ICERIK || {}, anahtar);
      if (deger === undefined) {
        throw new Error(`[bolum-parcalari] ${kaynak}: "${anahtar}" ${icerikDosyasi} içinde tanımlı değil.`);
      }
      return typeof deger === "function" ? deger() : String(deger);
    });
  }

  async function parcalariGom(html, modul, derinlik = 0) {
    if (derinlik > EN_FAZLA_DERINLIK) {
      throw new Error("[bolum-parcalari] Parça iç içe geçme sınırı aşıldı (döngüsel include olabilir).");
    }
    const isler = [];
    html.replace(PARCA_DESENI, (tamEslesme, ad) => {
      isler.push({ tamEslesme, ad });
      return tamEslesme;
    });
    if (!isler.length) return html;

    let sonuc = html;
    for (const { tamEslesme, ad } of isler) {
      let parca;
      try {
        parca = await readFile(parcaYolu(ad), "utf8");
      } catch {
        throw new Error(`[bolum-parcalari] Parça bulunamadı: ${parcaDizini}/${ad}.html`);
      }
      const doldurulmus = degiskenleriDoldur(parca, modul, `${parcaDizini}/${ad}.html`);
      const icIce = await parcalariGom(doldurulmus, modul, derinlik + 1);
      sonuc = sonuc.split(tamEslesme).join(icIce);
    }
    return sonuc;
  }

  return {
    name: "bolum-parcalari",
    enforce: "pre",

    configResolved(ayar) {
      kokDizin = ayar.root;
    },

    configureServer(sunucu) {
      // Parça veya içerik dosyası değişince tarayıcıyı tazele.
      sunucu.watcher.add([path.resolve(kokDizin, parcaDizini), icerikYolu()]);
      sunucu.watcher.on("change", (dosya) => {
        const izlenen =
          dosya.startsWith(path.resolve(kokDizin, parcaDizini)) || dosya === icerikYolu();
        if (izlenen) sunucu.ws.send({ type: "full-reload" });
      });
    },

    async transformIndexHtml(html) {
      const modul = await icerigiYukle();
      const degiskenliKabuk = degiskenleriDoldur(html, modul, "index.html");
      return parcalariGom(degiskenliKabuk, modul);
    },
  };
}
