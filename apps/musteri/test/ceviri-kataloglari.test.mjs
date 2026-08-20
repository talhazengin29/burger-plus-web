import test from "node:test";
import assert from "node:assert/strict";
import tr from "../src/locales/tr.js";
import en from "../src/locales/en.js";

const yapraklar = (nesne, onEk = "") => Object.entries(nesne).flatMap(([anahtar, deger]) => {
  const yol = onEk ? `${onEk}.${anahtar}` : anahtar;
  return deger && typeof deger === "object" ? yapraklar(deger, yol) : [[yol, deger]];
});
const degiskenler = (metin) => [...String(metin).matchAll(/{{\s*([\w]+)\s*}}/g)].map((eslesme) => eslesme[1]).sort();

test("müşteri Türkçe ve İngilizce katalog anahtarları eşleşir", () => {
  assert.deepEqual(yapraklar(en).map(([anahtar]) => anahtar).sort(), yapraklar(tr).map(([anahtar]) => anahtar).sort());
});

test("müşteri çevirileri boş değildir ve değişkenleri eşleşir", () => {
  const turkce = new Map(yapraklar(tr));
  for (const [anahtar, ingilizce] of yapraklar(en)) {
    assert.ok(String(ingilizce).trim(), `en.${anahtar} boş`);
    assert.ok(String(turkce.get(anahtar)).trim(), `tr.${anahtar} boş`);
    assert.deepEqual(degiskenler(ingilizce), degiskenler(turkce.get(anahtar)), `${anahtar} değişkenleri eşleşmiyor`);
  }
});
