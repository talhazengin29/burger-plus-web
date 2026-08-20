import test from "node:test";
import assert from "node:assert/strict";
import tr from "../src/locales/tr.js";
import en from "../src/locales/en.js";

function yapraklar(nesne, onEk = "") {
  return Object.entries(nesne).flatMap(([anahtar, deger]) => {
    const tamAnahtar = onEk ? `${onEk}.${anahtar}` : anahtar;
    return deger && typeof deger === "object"
      ? yapraklar(deger, tamAnahtar)
      : [[tamAnahtar, deger]];
  });
}

function degiskenler(metin) {
  return [...String(metin).matchAll(/{{\s*([\w]+)\s*}}/g)].map((eslesme) => eslesme[1]).sort();
}

test("Türkçe ve İngilizce katalogları aynı anahtarlara sahiptir", () => {
  const trAnahtarlari = yapraklar(tr).map(([anahtar]) => anahtar).sort();
  const enAnahtarlari = yapraklar(en).map(([anahtar]) => anahtar).sort();
  assert.deepEqual(enAnahtarlari, trAnahtarlari);
});

test("çeviri değerleri boş bırakılamaz", () => {
  for (const [dil, katalog] of [["tr", tr], ["en", en]]) {
    for (const [anahtar, deger] of yapraklar(katalog)) {
      assert.equal(typeof deger, "string", `${dil}.${anahtar} metin olmalı`);
      assert.ok(deger.trim(), `${dil}.${anahtar} boş bırakılamaz`);
    }
  }
});

test("iki dildeki dinamik değişkenler eşleşir", () => {
  const trHaritasi = new Map(yapraklar(tr));
  for (const [anahtar, ingilizce] of yapraklar(en)) {
    assert.deepEqual(degiskenler(ingilizce), degiskenler(trHaritasi.get(anahtar)), `${anahtar} değişkenleri eşleşmiyor`);
  }
});
