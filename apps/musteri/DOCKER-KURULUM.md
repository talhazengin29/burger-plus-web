# Docker ile Çalıştırma ve Telefonda Açma

Bu kılavuz MasanPOS müşteri uygulamasını Docker ile çalıştırmayı ve telefonda açmayı adım adım anlatır.

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
cd C:\Users\HP\Desktop\masanpos-web\apps\musteri
```

İmajı oluştur (sondaki nokta önemli — "buradaki Dockerfile'ı kullan" demek):

```
docker build -t masanpos-customer .
```

- `-t masanpos-customer` → imaja "masanpos-customer" adını verir.
- İlk sefer birkaç dakika sürer (Node imajını indirir, kütüphaneleri kurar,
  projeyi derler). Sonraki seferler çok daha hızlı olur.

Bittiğinde imajı görmek için:

```
docker images
```

Listede `masanpos-customer` görünmeli.

---

## 3. Konteyneri çalıştır (run)

```
docker run -d -p 8080:80 --name masanpos-customer masanpos-customer
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
docker stop masanpos-customer         # Konteyneri durdur
docker start masanpos-customer        # Tekrar başlat
docker rm masanpos-customer           # Konteyneri sil (önce durdur)
docker logs masanpos-customer         # Konteyner loglarını gör
docker rmi masanpos-customer     # İmajı sil
```

Kodda değişiklik yaptıysan, yeniden build alıp yeni konteyner çalıştır:

```
docker stop masanpos-customer
docker rm masanpos-customer
docker build -t masanpos-customer .
docker run -d -p 8080:80 --name masanpos-customer masanpos-customer
```

---

## Özet (hızlı başlangıç)

```
cd C:\Users\HP\Desktop\masanpos-web\apps\musteri
docker build -t masanpos-customer .
docker run -d -p 8080:80 --name masanpos-customer masanpos-customer
```

Sonra: bilgisayarda `http://localhost:8080`, telefonda `http://<bilgisayar-IP>:8080`
