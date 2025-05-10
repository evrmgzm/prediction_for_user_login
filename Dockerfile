# Lokal PHP sürümünüzle eşleştirmek iyi bir fikir olabilir (örn: php:8.4-cli)
# Ancak php:8.2-cli genellikle çoğu modern PHP uygulaması için yeterlidir.
FROM php:8.2-cli

WORKDIR /app

# Proje dosyalarını konteyner içindeki /app dizinine kopyala
COPY . /app

# Render.com'un bağlanacağı portu belirtiyoruz
EXPOSE 10000

# PHP'nin dahili sunucusunu başlat.
# 0.0.0.0 tüm ağ arayüzlerinden dinlemesini sağlar.
# 10000 portunu kullanır.
# backend/index.php dosyasını ana router script olarak kullanır.
CMD ["php", "-S", "0.0.0.0:10000", "backend/index.php"]