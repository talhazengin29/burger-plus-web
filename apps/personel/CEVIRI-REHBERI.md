# Personel uygulaması çeviri rehberi

## Temel kurallar

- Kaynak ve geri dönüş dili Türkçedir (`tr`).
- Kullanıcıya gösterilen yeni sabit metinler JSX içine yazılmaz; `src/locales/tr.js` ve `src/locales/en.js` dosyalarına aynı anahtarla eklenir.
- Çeviri anahtarları ekrana göre gruplanır: `login.*`, `kitchen.*`, `nav.*`.
- İşletme, ürün, kategori ve kişi adları gibi backend verileri çevrilmez.
- API hata mesajları backend tarafından geldiği haliyle gösterilir. İleride backend hata kodu döndürdüğünde kodlar ayrı bir `errors.*` kataloğunda çevrilmelidir.
- Para, tarih ve saat metinleri seçili dile göre `Intl` ile formatlanır.

## Yeni metin ekleme

```jsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
return <button>{t("common.save")}</button>;
```

Dinamik değerler katalogda adlandırılmış değişken kullanır:

```js
orderCount: "{{count}} sipariş"
```

```jsx
t("orders.orderCount", { count: siparisSayisi })
```

## AI çeviri akışı

AI doğrudan canlı uygulamaya bağlanmaz. Önerilen akış:

1. Türkçe katalogdaki yeni/değişmiş anahtarlar belirlenir.
2. Onaylı restoran terimleri sözlüğüyle AI taslağı oluşturulur.
3. Taslak insan kontrolünden geçer.
4. Onaylanan metin hedef dil kataloğuna eklenir.
5. `npm test`, `npm run lint` ve `npm run build` çalıştırılır.

`test/ceviri-kataloglari.test.mjs`; dillerde eksik anahtar, boş değer veya eşleşmeyen dinamik değişken olduğunda işlemi başarısız kılar.

## Yeni dil ekleme

1. `src/locales/en.js` yapısı kopyalanır.
2. Yeni katalog `src/i18n.js` kaynaklarına ve `DESTEKLENEN_DILLER` listesine eklenir.
3. Dil seçicide yeni seçenek tanımlanır.
4. Katalog bütünlüğü testine yeni dil eklenir.
