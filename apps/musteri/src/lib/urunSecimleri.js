export function haricMalzemeleriGetir(urun) {
  return urun.haricMalzemeler || urun.haric_malzemeler || urun.secimler?.haricMalzemeler || [];
}

export function gramajMetni(secimler) {
  if (!secimler?.ekstraGramaj) return null;
  return `+${secimler.ekstraGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Ekstra gramaj"}`;
}

export function sepetAnahtariOlustur(urun) {
  return JSON.stringify({
    id: urun.id,
    haricMalzemeler: [...haricMalzemeleriGetir(urun)].sort(),
    secimler: urun.secimler || {},
  });
}
