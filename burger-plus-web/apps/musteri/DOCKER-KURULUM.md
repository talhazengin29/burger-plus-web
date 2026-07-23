# Docker ile Çalıştırma ve Telefonda Açma

Bu kılavuz Burger Plus'ı Docker ile çalıştırmayı ve telefonda açmayı adım adım anlatır.

---

## 1. Docker Desktop'ı kur

Windows'ta https://www.docker.com/products/docker-desktop adresinden
**Docker Desktop**'ı indir ve kur. Kurduktan sonra bilgisayarı yeniden başlat.
Docker Desktop uygulamasını aç ve çalışır durumda (yeşil) olduğundan emin ol.

Kurulumu doğrulamak için terminalde:

```
docker --version
```

Bir sürüm numarası görürsen hazırsın.

---

## 2. İmajı oluştur (build)

Proje klasörüne gir (Dockerfile'ın olduğu yer):

```
cd C:\Users\HP\Desktop\burger-plus
```

İmajı oluştur (sondaki nokta önemli — "buradaki Dockerfile'ı kullan" demek):

```
docker build -t burger-plus .
```

- `-t burger-plus` → imaja "burger-plus" adını verir.
- İlk sefer birkaç dakika sürer (Node imajını indirir, kütüphaneleri kurar,
  projeyi derler). Sonraki seferler çok daha hızlı olur.

Bittiğinde imajı görmek için:

```
docker images
```

Listede `burger-plus` görünmeli.

---

## 3. Konteyneri çalıştır (run)

```
docker run -d -p 8080:80 --name burger burger-plus
```

Ne demek bu komut:
- `-d` → arka planda çalışsın (detached).
- `-p 8080:80` → **port eşleştirme**. Konteyner içinde nginx 80'de yayın yapıyor;
  bunu bilgisayarının 8080 portuna bağlıyoruz. (İstersen 8080 yerine başka
  bir port seçebilirsin.)
- `--name burger` → konteynere "burger" adını verir.

Şimdi bilgisayarında tarayıcıyı aç:

```
http://localhost:8080
```

Uygulama açılmalı. 🎉

---

## 4. Telefonda açma (aynı Wi-Fi)

Docker uygulamayı **bilgisayarında** çalıştırıyor. Telefonun bunu açması için
ikisinin de **aynı Wi-Fi ağında** olması ve telefonun bilgisayarının IP'sini
kullanması gerekir.

### 4.1. Bilgisayarının IP adresini bul

Windows'ta yeni bir terminal aç:

```
ipconfig
```

Çıktıda **"IPv4 Address"** satırını bul. `192.168.1.34` gibi bir şey olacak
(seninki farklı olabilir). Bu senin bilgisayarının yerel ağ adresi.

### 4.2. Telefonda aç

Telefonun tarayıcısına (bilgisayarınla aynı Wi-Fi'da olduğundan emin ol) yaz:

```
http://192.168.1.34:8080
```

(Yukarıdaki IP'yi kendi IP'nle değiştir.)

Uygulama telefonda açılmalı.

> **Açılmıyorsa:** Windows Güvenlik Duvarı engelliyor olabilir. Docker Desktop
> ilk çalıştığında genelde izin ister; istemediyse, güvenlik duvarında 8080
> portuna izin vermen gerekebilir. Ayrıca telefon ve bilgisayarın **kesinlikle
> aynı Wi-Fi'da** olmalı (misafir ağı değil).

---

## 5. QR kodları ve telefon

QR sistemi, uygulamanın açıldığı adresi kullanır. Yani:

- Telefonda `http://192.168.1.34:8080` ile açtıysan, QR üretme ekranından
  ürettiğin QR'lar da bu adrese göre olur (`http://192.168.1.34:8080/masa?no=3`).
- Bu QR'ları **aynı Wi-Fi'daki** başka telefonlar da okutup açabilir.

> Not: Bu sadece senin Wi-Fi ağında çalışır. Kafede müşterilerin kendi
> internetlerinden açması için siteyi internete yayınlaman gerekir (Vercel,
> Netlify vb. — ayrı bir adım).

---

## Sık kullanılan Docker komutları

```
docker ps                  # Çalışan konteynerleri gör
docker stop burger         # Konteyneri durdur
docker start burger        # Tekrar başlat
docker rm burger           # Konteyneri sil (önce durdur)
docker logs burger         # Konteyner loglarını gör
docker rmi burger-plus     # İmajı sil
```

Kodda değişiklik yaptıysan, yeniden build alıp yeni konteyner çalıştır:

```
docker stop burger
docker rm burger
docker build -t burger-plus .
docker run -d -p 8080:80 --name burger burger-plus
```

---

## Özet (hızlı başlangıç)

```
cd C:\Users\HP\Desktop\burger-plus
docker build -t burger-plus .
docker run -d -p 8080:80 --name burger burger-plus
```

Sonra: bilgisayarda `http://localhost:8080`, telefonda `http://<bilgisayar-IP>:8080`
