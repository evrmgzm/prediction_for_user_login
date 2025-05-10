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
- Sistemin temasına göre dark veya normal mod özelliği 
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
#### 6. Ekran görüntüleri
![white](https://github.com/user-attachments/assets/93d96b97-4418-4004-9f1e-20117c6dcf53)
---
![dark](https://github.com/user-attachments/assets/12b2a7fb-e628-41e0-8738-62b90f02cc6b)
---
![theme](https://github.com/user-attachments/assets/3f98287b-77a1-424b-ab60-ef07845e3ea8)
---
![screen](https://github.com/user-attachments/assets/d044d110-13dc-4a3b-b3bd-ae714fbd8226)
---
![image](https://github.com/user-attachments/assets/549f0799-b615-4c43-b806-0ecb7a2103a4)
---
![image](https://github.com/user-attachments/assets/ba3a124c-5687-4855-897d-0c178f86012c)
---
![image](https://github.com/user-attachments/assets/a2c2aff4-7d86-4d83-a11f-eb59f94f3a66)
---
![image](https://github.com/user-attachments/assets/fd008d9f-4ca6-4f2c-8de0-13e215ee68f5)


#### Uygulamaya buradan ulaşabilirsiniz : https://prediction-for-user-login.vercel.app
