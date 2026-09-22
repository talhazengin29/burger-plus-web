import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminKodu = await readFile(new URL("../src/screens/Admin.jsx", import.meta.url), "utf8");

test("satis raporu kampanya taslagi endpointini kullanir", () => {
  assert.match(adminKodu, /adminIstek\("\/kampanyalar\/taslak\?gun=30"\)/);
  assert.match(adminKodu, /buton="Kampanya taslağı oluştur"/);
});

test("veri analizi forma tasinir ve kayit isteginden ayrilir", () => {
  assert.match(adminKodu, /taslakAnalizi: sonuc\.analiz/);
  assert.match(adminKodu, /taslakAnalizi: _taslakAnalizi/);
  assert.match(adminKodu, /Taslak pasif hazırlandı/);
});
