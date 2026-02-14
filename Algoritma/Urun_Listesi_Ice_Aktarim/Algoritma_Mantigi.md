# Ürün Listesi Excel İçe Aktarım Algoritması

Bu algoritma, dinamik sütun eşleştirme ve birleşik veri (SERİ/LOT/SKT/UBB) ayıklama özelliklerine sahiptir.

## Çalışma Mantığı

1.  **Dosya Okuma:** `excelParser.ts` içindeki `parseExcelFile` fonksiyonu, `xlsx` kütüphanesini kullanarak dosyayı ikili (binary) formatta okur ve JSON dizisine çevirir.
2.  **Sütun Algılama:** İlk satırı başlık (header) olarak kabul eder. Her sütun için ilk 10 satırı inceleyerek veri tipini (Metin, Sayı, Tarih) tahmin eder.
3.  **Birleşik Veri Tespiti (Gelişmiş):** 
    *   Tüm satırlar taranır. 
    *   Regex (Düzenli İfadeler) kullanılarak "SERI:", "LOT:", "SKT:", "UBB:" anahtar kelimeleri aranır.
    *   Eğer bir hücrede bu kalıplardan en az 2 tanesi bulunursa, o sütun "Birleşik Veri" (`hasCombinedData`) olarak işaretlenir.
    *   Farklı veri tipleri için örnekler (Samples) toplanır.
4.  **Dinamik Eşleştirme (Frontend):** `ExcelImportPage.tsx` üzerinde kullanıcıya her Excel sütunu için hedef bir alan seçtirilir (Ürün Adı, Miktar, vb.).
5.  **Otomatik Eşleştirme:** Sütun adları (örn: "Ürün Adı", "Miktar") ile sistemdeki alan adları benzerlik kontrolü yapılarak otomatik eşleştirilir.
6.  **Veri Ayıklama ve Kayıt:**
    *   Kullanıcı "İçe Aktar" dediğinde her satır döngüye alınır.
    *   Birleşik veri olan sütunlar için `extractCombinedCellData` fonksiyonu her alanı (Seri, Lot, vb.) kendi regex kalıbıyla ayıklayıp ilgili ürün alanına atar.
    *   Yeni alanlar (`NEW`) varsa önce bu alanlar oluşturulur, sonra veriler kaydedilir.

## Kullanılan Regex Kalıbları
*   **SERI:** `/(?:SERI|SERİ):\s*([^\\/\\\\]+)/i`
*   **LOT:** `/LOT:\s*([^\\/\\\\]+)/i`
*   **SKT:** `/SKT:\s*(\d{2}[\.\/]\d{2}[\.\/]\d{4})/i`
*   **UBB:** `/UBB:\s*([^\\/\\\\]+)/i`
