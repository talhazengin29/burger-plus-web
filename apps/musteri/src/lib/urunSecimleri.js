export function haricMalzemeleriGetir(urun) {
  return urun.haricMalzemeler || urun.haric_malzemeler || urun.secimler?.haricMalzemeler || [];
}

export function gramajMetni(secimler) {
  const parcalar = [];
  if (Number(secimler?.toplamGramaj) > 0) {
    const ek = Number(secimler.ekstraGramaj) > 0 ? ` (+${secimler.ekstraGramaj})` : " (Standart)";
    parcalar.push(`${secimler.toplamGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Gramaj"}${ek}`);
  } else if (secimler?.ekstraGramaj) {
    parcalar.push(`+${secimler.ekstraGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Ekstra gramaj"}`);
  }
  if (secimler?.boyutEtiketi) parcalar.push(`${secimler.boyutEtiketi}: ${secimler.boyutMiktar} ${secimler.boyutBirim}`);
  if (secimler?.yanBoyutEtiketi) parcalar.push(`${secimler.yanLezzetAd}: ${secimler.yanBoyutEtiketi} (${secimler.yanBoyutMiktar} ${secimler.yanBoyutBirim})`);
  if (secimler?.icecekBoyutEtiketi) parcalar.push(`${secimler.icecekAd}: ${secimler.icecekBoyutEtiketi} (${secimler.icecekBoyutMiktar} ${secimler.icecekBoyutBirim})`);
  return parcalar.length ? parcalar.join(" · ") : null;
}

export function sepetAnahtariOlustur(urun) {
  return JSON.stringify({
    id: urun.id,
    haricMalzemeler: [...haricMalzemeleriGetir(urun)].sort(),
    secimler: urun.secimler || {},
  });
}
