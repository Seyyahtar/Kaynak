# API Sözleşmesi - Stok Yönetim Uygulaması

Bu dokümantasyon, Stok Yönetim Uygulaması için REST API endpoint'lerini açıklar.

## Base URL

```
http://localhost:8080/api
```

## Genel Bilgiler

- **Format**: JSON
- **Authentication**: Şu anda basit kullanıcı ID tabanlı (JWT ileride eklenecek)
- **Encoding**: UTF-8
- **HTTP Methods**: GET, POST, PUT, DELETE

## API Response Format

Tüm API yanıtları aşağıdaki formatta döner:

```json
{
  "success": true/false,
  "message": "İşlem mesajı",
  "data": { ...veri... },
  "errors": { ...hatalar... }
}
```

---

## Authentication Endpoints

### 1. Login - Kullanıcı Girişi

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "username": "test",
  "password": "test123"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "username": "test",
    "email": "test@stok.app",
    "fullName": "Test User",
    "lastLogin": "2026-01-20T18:00:00",
    "createdAt": "2026-01-15T10:00:00"
  }
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "User not found"
}
```

### 2. Get Current User

**Endpoint**: `GET /auth/me?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "test",
    ...
  }
}
```

### 3. Register - Kullanıcı Kaydı

**Endpoint**: `POST /auth/register?username={name}&fullName={name}&email={email}`

**Success Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { ...user... }
}
```

---

## Stock Management Endpoints

### 1. Get All Stock - Tüm Stokları Getir

**Endpoint**: `GET /stock?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "materialName": "Kalp Stenti",
      "serialLotNumber": "LOT123456",
      "ubbCode": "UBB789012",
      "expiryDate": "2025-12-31",
      "quantity": 5,
      "dateAdded": "2026-01-20",
      "fromField": "Tedarikçi A",
      "toField": "",
      "materialCode": "MAT001",
      "createdAt": "2026-01-20T15:00:00",
      "updatedAt": "2026-01-20T15:00:00"
    }
  ]
}
```

### 2. Add Stock - Stok Ekle

**Endpoint**: `POST /stock?userId={uuid}`

**Request Body**:
```json
{
  "materialName": "Kalp Stenti",
  "serialLotNumber": "LOT123456",
  "ubbCode": "UBB789012",
  "expiryDate": "2025-12-31",
  "quantity": 5,
  "dateAdded": "2026-01-20",
  "fromField": "Tedarikçi A",
  "toField": "",
  "materialCode": "MAT001"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Stock item added successfully",
  "data": { ...stock item... }
}
```

**Error Response (400)** - Duplicate:
```json
{
  "success": false,
  "message": "Stock item with same material name and serial number already exists"
}
```

### 3. Update Stock - Stok Güncelle

**Endpoint**: `PUT /stock/{id}?userId={uuid}`

**Request Body**: (Same as Add Stock)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Stock item updated successfully",
  "data": { ...updated stock item... }
}
```

### 4. Delete Stock - Stok Sil

**Endpoint**: `DELETE /stock/{id}?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Stock item deleted successfully",
  "data": null
}
```

### 5. Remove Stock (Bulk) - Stok Çıkışı

**Endpoint**: `POST /stock/remove?userId={uuid}`

**Request Body**:
```json
[
  {
    "materialName": "Kalp Stenti",
    "serialLotNumber": "LOT123456",
    "quantity": 2
  },
  {
    "materialName": "Balon Kateter",
    "serialLotNumber": "LOT789012",
    "quantity": 1
  }
]
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Stock items removed successfully",
  "data": null
}
```

**Error Response (400)** - Insufficient Quantity:
```json
{
  "success": false,
  "message": "Insufficient quantity for: Kalp Stenti"
}
```

### 6. Check Duplicate - Duplicate Kontrolü

**Endpoint**: `GET /stock/check-duplicate?materialName={name}&serialLotNumber={number}&userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "data": true  // or false
}
```

---

## Case Management Endpoints

### 1. Get All Cases - Tüm Vakaları Getir

**Endpoint**: `GET /cases?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "caseDate": "2026-01-20",
      "hospitalName": "Ankara Şehir Hastanesi",
      "doctorName": "Dr. Mehmet Yılmaz",
      "patientName": "Ahmet Kaya",
      "notes": "Başarılı operasyon",
      "materials": [
        {
          "id": "uuid",
          "materialName": "Kalp Stenti",
          "serialLotNumber": "LOT123456",
          "ubbCode": "UBB789012",
          "quantity": 2
        }
      ],
      "createdAt": "2026-01-20T16:00:00"
    }
  ]
}
```

### 2. Get Case By ID - Vaka Detayı

**Endpoint**: `GET /cases/{id}?userId={uuid}`

**Success Response (200)**: (Same as Get All Cases item)

### 3. Create Case - Vaka Oluştur

**Endpoint**: `POST /cases?userId={uuid}`

**Request Body**:
```json
{
  "caseDate": "2026-01-20",
  "hospitalName": "Ankara Şehir Hastanesi",
  "doctorName": "Dr. Mehmet Yılmaz",
  "patientName": "Ahmet Kaya",
  "notes": "Başarılı operasyon",
  "materials": [
    {
      "materialName": "Kalp Stenti",
      "serialLotNumber": "LOT123456",
      "ubbCode": "UBB789012",
      "quantity": 2
    },
    {
      "materialName": "Balon Kateter",
      "serialLotNumber": "LOT789012",
      "quantity": 1
    }
  ]
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Case record created successfully",
  "data": { ...case record... }
}
```

---

## Checklist Management Endpoints

### 1. Get All Checklists - Tüm Kontrol Listelerini Getir

**Endpoint**: `GET /checklists?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Haftalık Hasta Takibi",
      "createdDate": "2026-01-20T10:00:00",
      "completedDate": null,
      "isCompleted": false,
      "patients": [
        {
          "id": "uuid",
          "name": "Ayşe Demir",
          "note": "Kontrol muayenesi",
          "phone": "0532 123 4567",
          "city": "Ankara",
          "hospital": "Ankara Şehir Hastanesi",
          "appointmentDate": "2026-01-22",
          "appointmentTime": "14:00:00",
          "checked": false
        }
      ]
    }
  ]
}
```

### 2. Get Active Checklist - Aktif Kontrol Listesi

**Endpoint**: `GET /checklists/active?userId={uuid}`

**Success Response (200)**: (Same format as above, single item)

### 3. Create Checklist - Kontrol Listesi Oluştur

**Endpoint**: `POST /checklists?userId={uuid}`

**Request Body**:
```json
{
  "title": "Haftalık Hasta Takibi",
  "patients": [
    {
      "name": "Ayşe Demir",
      "note": "Kontrol muayenesi",
      "phone": "0532 123 4567",
      "city": "Ankara",
      "hospital": "Ankara Şehir Hastanesi",
      "appointmentDate": "2026-01-22",
      "appointmentTime": "14:00:00",
      "checked": false
    }
  ]
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Checklist created successfully",
  "data": { ...checklist... }
}
```

### 4. Update Checklist - Kontrol Listesi Güncelle

**Endpoint**: `PUT /checklists/{id}?userId={uuid}`

**Request Body**: (Same as Create)

**Success Response (200)**: Güncellenen checklist

### 5. Complete Checklist - Kontrol Listesini Tamamla

**Endpoint**: `POST /checklists/{id}/complete?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Checklist completed successfully",
  "data": {
    ...checklist with completedDate set...
  }
}
```

---

## History Endpoints

### 1. Get All History - Tüm Geçmişi Getir

**Endpoint**: `GET /history?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "recordDate": "2026-01-20T15:30:00",
      "type": "stock-add",
      "description": "Stok eklendi: Kalp Stenti (5 adet)",
      "details": {
        "materialName": "Kalp Stenti",
        "serialLotNumber": "LOT123456",
        "quantity": 5
      },
      "createdAt": "2026-01-20T15:30:00"
    },
    {
      "id": "uuid",
      "recordDate": "2026-01-20T16:00:00",
      "type": "case",
      "description": "Vaka kaydı oluşturuldu: Ahmet Kaya - Ankara Şehir Hastanesi",
      "details": {
        "hospitalName": "Ankara Şehir Hastanesi",
        "doctorName": "Dr. Mehmet Yılmaz",
        "patientName": "Ahmet Kaya",
        "materialsCount": 2
      },
      "createdAt": "2026-01-20T16:00:00"
    }
  ]
}
```

### 2. Delete History - Geçmiş Kaydını Sil

**Endpoint**: `DELETE /history/{id}?userId={uuid}`

**Success Response (200)**:
```json
{
  "success": true,
  "message": "History record deleted successfully",
  "data": null
}
```

---

## History Record Types

- `stock-add`: Stok ekleme işlemi
- `stock-remove`: Stok çıkış işlemi
- `stock-delete`: Stok silme işlemi
- `case`: Vaka kaydı oluşturma
- `checklist`: Kontrol listesi oluşturma

---

## HTTP Status Codes

- **200 OK**: Başarılı GET/PUT/DELETE işlemi
- **201 Created**: Başarılı POST işlemi (yeni kayıt)
- **400 Bad Request**: Geçersiz istek, validation hatası
- **404 Not Found**: Kayıt bulunamadı
- **500 Internal Server Error**: Sunucu hatası

---

## Error Response Format

```json
{
  "success": false,
  "message": "Hata mesajı",
  "errors": {
    "field1": "Error message 1",
    "field2": "Error message 2"
  }
}
```

---

## Örnek cURL Komutları

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "test123"
  }'
```

### Add Stock
```bash
curl -X POST "http://localhost:8080/api/stock?userId=00000000-0000-0000-0000-000000000002" \
  -H "Content-Type: application/json" \
  -d '{
    "materialName": "Kalp Stenti",
    "serialLotNumber": "LOT123456",
    "ubbCode": "UBB789012",
    "expiryDate": "2025-12-31",
    "quantity": 5,
    "dateAdded": "2026-01-20",
    "materialCode": "MAT001"
  }'
```

### Get All Stock
```bash
curl -X GET "http://localhost:8080/api/stock?userId=00000000-0000-0000-0000-000000000002"
```

### Create Case
```bash
curl -X POST "http://localhost:8080/api/cases?userId=00000000-0000-0000-0000-000000000002" \
  -H "Content-Type: application/json" \
  -d '{
    "caseDate": "2026-01-20",
    "hospitalName": "Ankara Şehir Hastanesi",
    "doctorName": "Dr. Mehmet Yılmaz",
    "patientName": "Ahmet Kaya",
    "notes": "Başarılı operasyon",
    "materials": [
      {
        "materialName": "Kalp Stenti",
        "serialLotNumber": "LOT123456",
        "ubbCode": "UBB789012",
        "quantity": 2
      }
    ]
  }'
```

---

## Frontend Integration

Frontend'de API çağrıları için yeni bir servis katmanı oluşturmanız gerekecek:

### Örnek: `src/services/api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Kullanıcı ID'sini localStorage'dan al
const getUserId = () => {
  const user = localStorage.getItem('medical_inventory_user');
  return user ? JSON.parse(user).id : null;
};

export const stockApi = {
  getAll: () => axios.get(`${API_BASE_URL}/stock?userId=${getUserId()}`),
  add: (data) => axios.post(`${API_BASE_URL}/stock?userId=${getUserId()}`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/stock/${id}?userId=${getUserId()}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/stock/${id}?userId=${getUserId()}`),
  remove: (items) => axios.post(`${API_BASE_URL}/stock/remove?userId=${getUserId()}`, items),
};

export const caseApi = {
  getAll: () => axios.get(`${API_BASE_URL}/cases?userId=${getUserId()}`),
  create: (data) => axios.post(`${API_BASE_URL}/cases?userId=${getUserId()}`, data),
};

// ... diğer API'ler
```

---

## Notes

1. **userId** parametresi şu anda query parameter olarak gönderiliyor. JWT implementasyonu eklendiğinde, bu token'dan otomatik alınacak.

2. **Tarih formatları**: ISO 8601 formatında (YYYY-MM-DD veya YYYY-MM-DDTHH:mm:ss)

3. **UUID'ler**: Tüm ID'ler UUID formatındadır.

4. **Synchronization**: Birden fazla cihazdan aynı kullanıcı ile bağlanıldığında, veriler otomatik olarak senkronize olacaktır.
