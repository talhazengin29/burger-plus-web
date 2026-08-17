function guvenliSayi(deger) {
  const sayi = Number(deger);
  return Number.isFinite(sayi) ? sayi : 0;
}

// Backend ile aynı kuruş ve baz-puan hesabını kullanır:
// %5 => 500 baz puan, 1.000 TL => 50 TL bonus.
export function yuzdeTutariniHesapla(tutar, yuzde) {
  const tutarKurus = Math.max(0, Math.round(guvenliSayi(tutar) * 100));
  const sinirliYuzde = Math.min(100, Math.max(0, guvenliSayi(yuzde)));
  const yuzdeBazPuan = Math.round(sinirliYuzde * 100);
  return Math.round(tutarKurus * yuzdeBazPuan / 10_000) / 100;
}

export function yuzdeliToplamiHesapla(tutar, yuzde) {
  const guvenliTutar = Math.max(0, guvenliSayi(tutar));
  return guvenliTutar + yuzdeTutariniHesapla(guvenliTutar, yuzde);
}
