# Stok Yönetim Uygulaması - Backend

Spring Boot tabanlı REST API backend uygulaması.

## Teknolojiler

- **Java**: 17+
- **Framework**: Spring Boot 3.2.1
- **Database**: PostgreSQL
- **ORM**: JPA / Hibernate
- **Migration**: Flyway
- **Build Tool**: Maven
- **Security**: Spring Security (JWT hazır, şu an devre dışı)

## Özellikler

- ✅ Stok yönetimi (CRUD işlemleri)
- ✅ Vaka takibi
- ✅ Kontrol listesi yönetimi
- ✅ İşlem geçmişi
- ✅ Otomatik history logging
- ✅ CORS desteği (Android & PC)
- ✅ Transaction yönetimi
- ✅ Validation
- ✅ Global exception handling
- 🔜 JWT Authentication

## Kurulum

### Gereksinimler

- Java 17 veya üzeri
- Maven 3.6+
- PostgreSQL 12+

### 1. Veritabanı Kurulumu

PostgreSQL'de yeni bir veritabanı oluşturun:

```sql
CREATE DATABASE stok_yonetim;
```

### 2. Konfigürasyon

`src/main/resources/application.yml` dosyasındaki veritabanı bilgilerini güncelleyin:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/stok_yonetim
    username: postgres
    password: your_password
```

### 3. Build

```bash
mvn clean install
```

### 4. Çalıştırma

```bash
mvn spring-boot:run
```

Uygulama `http://localhost:8080/api` adresinde çalışacaktır.

## API Dokümantasyonu

Detaylı API dokümantasyonu için [API_CONTRACT.md](./API_CONTRACT.md) dosyasına bakın.

## Proje Yapısı

```
src/main/java/com/stok/app/
├── config/           # Konfigürasyon sınıfları (CORS, Security)
├── controller/       # REST controllers
├── dto/              # Data Transfer Objects
│   ├── request/      # Request DTOs
│   └── response/     # Response DTOs
├── entity/           # JPA entities
├── exception/        # Exception handling
├── repository/       # Spring Data JPA repositories
├── service/          # Business logic
└── StokApplication.java  # Main application class
```

## Veritabanı Şeması

Flyway migration script'i (`V1__initial_schema.sql`) otomatik olarak aşağıdaki tabloları oluşturur:

- `users` - Kullanıcı bilgileri
- `stock_items` - Stok kalemleri
- `case_records` - Vaka kayıtları
- `case_materials` - Vakada kullanılan malzemeler
- `checklist_records` - Kontrol listeleri
- `checklist_patients` - Kontrol listesi hastaları
- `history_records` - İşlem geçmişi

## Örnek Kullanıcılar

Veritabanı migration sırasında otomatik oluşturulan test kullanıcıları:

| Username | Password | User ID |
|----------|----------|---------|
| admin | admin123 | 00000000-0000-0000-0000-000000000001 |
| test | test123 | 00000000-0000-0000-0000-000000000002 |

## Test Etme

### Postman Collection

API'yi test etmek için örnek istekler:

#### Login
```
POST http://localhost:8080/api/auth/login
Body: {"username": "test", "password": "test123"}
```

#### Get Stock
```
GET http://localhost:8080/api/stock?userId=00000000-0000-0000-0000-000000000002
```

#### Add Stock
```
POST http://localhost:8080/api/stock?userId=00000000-0000-0000-0000-000000000002
Body: {
  "materialName": "Test Material",
  "serialLotNumber": "TEST123",
  "quantity": 10,
  "dateAdded": "2026-01-20"
}
```

## Production Deployment

Production'a deploy etmeden önce:

1. `application.yml` dosyasında:
   - Database credentials'ı güncelleyin
   - JWT secret key'i değiştirin
   - CORS allowed-origins listesini güncelleyin

2. SSL/TLS sertifikası ekleyin

3. Production profile oluşturun (`application-prod.yml`)

4. Build:
   ```bash
   mvn clean package -DskipTests
   ```

5. JAR dosyasını çalıştırın:
   ```bash
   java -jar target/stok-yonetim-backend-1.0.0.jar --spring.profiles.active=prod
   ```

## Frontend Entegrasyonu

Frontend'de `src/utils/storage.ts` yerine API çağrıları kullanın.

Örnek servis katmanı için [API_CONTRACT.md](./API_CONTRACT.md#frontend-integration) bölümüne bakın.

## Lisans

MIT License

## İletişim

Sorularınız için: [GitHub Issues](https://github.com/...)
