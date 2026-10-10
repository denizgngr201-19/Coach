# Koç Takip

Spor hocaları için öğrenci ve antrenman takip uygulaması. Telefona ve iPad'e "Ana Ekrana Ekle" ile uygulama gibi kurulur, internetsiz çalışır.

## Özellikler
- **Bu Hafta**: ders / öğrenci / kardiyo dakikası (geçen haftayla karşılaştırmalı), günlere göre dağılım, bitmek üzere olan paketler, 14+ gündür gelmeyen öğrenciler
- **Öğrenciler**: profil, sakatlık notları, paket takibi (kalan ders), seans geçmişi
- **İlerleme**: her egzersiz için en ağır set, tahmini 1RM, hacim, tekrar; kardiyoda süre, mesafe, tempo grafikleri
- **Ölçümler**: kilo, yağ oranı, bel/göğüs/kol/kalça/bacak
- **Seans girişi**: birebir veya grup dersi, şablondan yükle, son seansı tekrarla, her egzersizde "geçen sefer" bilgisi
- **Şablonlar**: sık kullanılan antrenmanlar
- **Yedekleme**: tek dokunuşla JSON yedek al / yükle

## Veriler
Tüm veriler sadece cihazda (tarayıcı depolaması) tutulur; sunucu yoktur. Cihaz kaybına karşı Ayarlar → **Yedek al** ile düzenli yedek alınmalıdır. iPhone/iPad'de uygulama mutlaka **Ana Ekrana Ekle** ile kurulup oradan açılmalıdır (Safari sekmesinde kullanılan veriler, uzun süre girilmezse silinebilir).

## Yayınlama (GitHub Pages)
Settings → Pages → *Deploy from a branch* → `main` / `(root)`. Derleme adımı yoktur; düz HTML/CSS/JS.

Güncelleme yayınlarken `sw.js` içindeki `CACHE` sürümünü artırın.

## Yerelde çalıştırma
```
python3 -m http.server 8000
```
→ http://localhost:8000
