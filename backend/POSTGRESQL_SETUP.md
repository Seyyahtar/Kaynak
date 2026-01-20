# PostgreSQL Kurulum ve Yapılandırma Rehberi

## Adım 1: PostgreSQL Kurulumunu Kontrol Et

PostgreSQL servisi çalışıyor ✅ (postgresql-x64-18)

## Adım 2: Veritabanını Oluştur

PostgreSQL'de `stok_yonetim` adında bir veritabanı oluşturmanız gerekiyor.

### Windows'ta pgAdmin Kullanarak:

1. **pgAdmin 4**'ü açın (Başlat menüsünden "pgAdmin" arayın)
2. Sol panelde **PostgreSQL 18** sunucusuna çift tıklayın
3. Kurulum sırasında belirlediğiniz **postgres şifresini** girin
4. **Databases** üzerine sağ tıklayın → **Create** → **Database...**
5. Database name: `stok_yonetim` yazın
6. **Save** butonuna tıklayın

### Veya SQL Shell (psql) Kullanarak:

1. Başlat menüsünden **SQL Shell (psql)** açın
2. Server, Database, Port, Username için Enter'a basın (varsayılanları kullanmak için)
3. Postgres şifrenizi girin
4. Şu komutu çalıştırın:
   ```sql
   CREATE DATABASE stok_yonetim;
   ```
5. Veritabanının oluştuğunu kontrol edin:
   ```sql
   \l
   ```

## Adım 3: application.yml'deki Şifreyi Güncelle

Şu anda [application.yml](file:///d:/GitHub/Kaynak/backend/src/main/resources/application.yml#L14) dosyasında şifre `postgres` olarak ayarlanmış:

```yaml
datasource:
  url: jdbc:postgresql://localhost:5432/stok_yonetim
  username: postgres
  password: postgres  # <-- Burası doğru mu?
```

**PostgreSQL kurulumu sırasında belirlediğiniz şifreyi buraya yazın.**

## Adım 4: Uygulamayı Başlat

Veritabanını oluşturduktan ve şifreyi güncelledikten sonra:

```powershell
# PostgreSQL profili ile (varsayılan)
unset SPRING_PROFILES_ACTIVE  # veya Remove-Item Env:\SPRING_PROFILES_ACTIVE
mvn spring-boot:run
```

## Olası Sorunlar ve Çözümler

### Hata: "password authentication failed"
- ✅ application.yml'deki şifreyi kontrol edin
- ✅ PostgreSQL kurulumunda belirlediğiniz şifreyi kullanın

### Hata: "database does not exist"
- ✅ Yukarıdaki adımları takip ederek veritabanını oluşturun

### Hata: "Connection refused"
- ✅ PostgreSQL servisinin çalıştığından emin olun
- ✅ Port 5432'nin kullanımda olduğunu kontrol edin

## Doğru Yapılandırma Kontrolü

Uygulama başladığında şu mesajları görmelisiniz:

```
✅ Flyway migration başarılı
✅ HikariPool-1 - Start completed
✅ Started Application in X.XXX seconds
```

Sorun yaşarsanız hata mesajını paylaşın, yardımcı olabilirim! 🚀
