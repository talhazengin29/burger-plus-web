import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DESTEKLENEN_DILLER, SOZLUK } from "../src/dil/sozluk.js";

function duzlestir(nesne, kok = "") {
  return Object.entries(nesne).flatMap(([anahtar, deger]) => {
    const yol = kok ? `${kok}.${anahtar}` : anahtar;
    return deger && typeof deger === "object" ? duzlestir(deger, yol) : [[yol, deger]];
  });
}

function degiskenler(metin) {
  return [...String(metin).matchAll(/{{\s*(\w+)\s*}}/g)].map((eslesme) => eslesme[1]).sort();
}

test("yalnızca desteklenen müşteri dilleri tanımlı", () => {
  assert.deepEqual(DESTEKLENEN_DILLER, ["tr", "en"]);
  assert.deepEqual(Object.keys(SOZLUK), DESTEKLENEN_DILLER);
});

test("TR ve EN sözlük anahtarları ile değişkenleri eşleşiyor", () => {
  const turkce = new Map(duzlestir(SOZLUK.tr));
  const ingilizce = new Map(duzlestir(SOZLUK.en));

  assert.deepEqual([...ingilizce.keys()].sort(), [...turkce.keys()].sort());
  for (const [anahtar, metin] of turkce) {
    assert.equal(typeof metin, "string", `${anahtar} metin olmalı`);
    assert.notEqual(metin.trim(), "", `${anahtar} boş olmamalı`);
    assert.deepEqual(degiskenler(ingilizce.get(anahtar)), degiskenler(metin), `${anahtar} değişkenleri eşleşmeli`);
  }
});

test("müşteri sipariş akışında kullanılan sabit çeviri anahtarları sözlükte var", async () => {
  const dosyalar = [
    "App.jsx", "components/BottomNav.jsx", "components/OrtakHeader.jsx", "components/DilSecici.jsx",
    "screens/TableWelcome.jsx", "screens/Home.jsx", "screens/Campaigns.jsx", "screens/UrunDetay.jsx", "screens/Cart.jsx",
    "screens/QrScan.jsx", "screens/Payment.jsx", "screens/PaymentSuccess.jsx", "screens/Wallet.jsx",
    "screens/ProfilDuzenle.jsx", "screens/Sikayet.jsx",
  ];
  const anahtarlar = new Set(duzlestir(SOZLUK.tr).map(([anahtar]) => anahtar));

  for (const dosya of dosyalar) {
    const kaynak = await readFile(new URL(`../src/${dosya}`, import.meta.url), "utf8");
    for (const eslesme of kaynak.matchAll(/\bt\("([^"]+)"/g)) {
      assert.ok(anahtarlar.has(eslesme[1]), `${dosya}: ${eslesme[1]} sözlükte bulunamadı`);
    }
  }
});
