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
![image](https://github.com/user-attachments/assets/2784f9fe-e9c0-4fbf-827c-912ed57dff47)
---
![image](https://github.com/user-attachments/assets/e7097810-3de5-41d6-b677-4a61ea8fe09f)
---
![image](https://github.com/user-attachments/assets/b96e4791-9761-4fcb-8d25-764b0cba4e70)
---
![image](https://github.com/user-attachments/assets/f1f95109-5c40-404d-9298-5e992f03fbd3)


#### Uygulamaya buradan ulaşabilirsiniz : https://prediction-for-user-login.vercel.app
