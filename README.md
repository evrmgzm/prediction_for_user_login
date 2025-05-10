# Kullanıcı Giriş Tahmin Sistemi

Bu proje, kullanıcıların geçmiş login (giriş) verilerini analiz ederek bir sonraki olası login zamanlarını tahmin eden bir web uygulamasıdır. Sistem, üç farklı tahmin algoritması kullanarak karşılaştırmalı sonuçlar üretir ve tahminlerin güvenilirlik seviyelerini gösterir.

---

## 🚀 Proje Özellikleri

- Kullanıcı dostu ve duyarlı (responsive) arayüz
- Üç farklı tahmin algoritmasıyla analiz:
  1. Ortalama Zaman Aralığı (Akıllı Aralık Analizi)
  2. Haftalık Periyodik Örüntü Analizi
  3. Günlük Dinamik Örüntü Analizi
- Tahmin güvenilirlik dereceleri (Yüksek, Orta, Düşük)
- Arama ve sıralama işlevleri
- Kapsamlı hata yönetimi
- Yenileme butonu ile veri güncelleme

---

## 🧠 Kullanılan Tahmin Algoritmaları

| Algoritma | Açıklama |
|----------|----------|
| **Akıllı Aralık Analizi** | Kullanıcının giriş zamanları arasındaki genel, günlük ve haftalık aralık örüntülerini analiz eder. |
| **Periyodik Örüntü Analizi** | Haftalık ve günlük dönemsellikleri değerlendirerek geçmiş giriş kalıplarını öğrenir. |
| **Dinamik Örüntü Analizi** | Kullanıcının girişlerini farklı zaman ölçeklerinde analiz ederek kişiselleştirilmiş tahminlerde bulunur. |

---

## 🛠️ Kullanılan Teknolojiler

### 🔙 Backend

- **PHP** (v7.4+)
- **JSON** veri formatı
- API Kaynağı: `http://localhost:8000/index.php` (gerçekleştirilmiş veri sağlayıcı: `case-test-api.humanas.io`)

### 🔜 Frontend

- **React** (v18)
- **Vite** (modern build aracı)
- **JavaScript (ES6+)**
- **CSS3** (özelleştirilmiş stiller)
- **date-fns** (`format`, `parseISO`, `formatDistanceToNow` gibi tarih işlemleri için)
- **Responsive** tasarım desteği

---

## 📁 Kurulum ve Çalıştırma

### 1. Gerekli Yazılımlar

- [Node.js (v16+)](https://nodejs.org/)
- [PHP (7.4+)](https://www.php.net/)
- Paket yöneticisi olarak `npm` ya da `yarn`

### 2. Projeyi Klonla

```bash
git clone https://github.com/kullanici/kullanici-giris-tahmin.git
cd kullanici-giris-tahmin
```
### 3. Frontend Kurulumu (React)

```bash
cd frontend
npm install
npm run dev
```
### 4. Backend Kurulumu (PHP)

```bash
cd backend
php -S localhost:8000
```
### 5. Proje Yapısı

```bash
kullanici-giris-tahmin/
├── backend/
│   └── index.php
├── frontend/
│   ├── App.jsx
│   ├── main.jsx
│   ├── App.css
│   └── ...
├── README.md
└── package.json
```

#### Uygulamaya buradan ulaşabilirsiniz. `[http://localhost:8000/index.php](https://prediction-for-user-login.vercel.app)`
