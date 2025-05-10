FROM php:8.2-cli

# Çalışma dizinini belirle
WORKDIR /var/www

# Dosyaları kopyala
COPY . .

# Port aç
EXPOSE 8000

# Başlangıç komutu
CMD [ "php", "-S", "0.0.0.0:8000", "-t", "backend" ]
