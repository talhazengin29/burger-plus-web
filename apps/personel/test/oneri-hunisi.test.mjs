import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminKodu = await readFile(new URL("../src/screens/Admin.jsx", import.meta.url), "utf8");
const cssKodu = await readFile(new URL("../src/screens/Admin.css", import.meta.url), "utf8");

test("satis raporu guvenli oneri hunisini ve urun performansini gosterir", () => {
  assert.match(adminKodu, /rapor\.oneriHunisi/);
  assert.match(adminKodu, /Öneri dönüşüm akışı/);
  assert.match(adminKodu, /rapor\.oneriUrunleri/);
  assert.match(adminKodu, /Önerilen ürün performansı/);
});

test("oneri hunisi dar ekranlarda iki sutuna iner", () => {
  assert.match(cssKodu, /@media\(max-width:680px\)[\s\S]*\.oneri-hunisi\{grid-template-columns:1fr 1fr\}/);
});
