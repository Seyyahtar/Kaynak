# Stok Listesi Excel İçe Aktarım Algoritması

Bu algoritma, 3 farklı ön tanımlı Excel formatını tanıyabilen ve verileri hızlıca stoka ekleyen bir yapıdadır.

## Çalışma Mantığı

1.  **Format Tespiti:** `excelUtils.ts` içindeki `importFromExcel` fonksiyonu, dosya başlıklarını (headers) inceleyerek 3 tipten birini seçer:
    *   **Çıktı Tablosu:** "Seri/Lot No" ve "S.K.T" başlıklarını içeren format.
    *   **2. Tip Veri Tablosu:** "Açıklama" hücresi içinde `\` ile ayrılmış LOT/SKT/UBB verileri olan format.
    *   **1. Tip Veri Tablosu:** "Takip Numarası" ve "Son Kullanma Tarihi" başlıklarını kullanan format.
2.  **Veri Ayıklama (Parsing):**
    *   Format tipine göre ilgili sütun indeksleri belirlenir.
    *   Eğer veri bir "Açıklama" hücresi içindeyse (Legacy veya Type2), `\` karakterine göre bölünür ve Regex ile ayıklanır.
    *   Tarih verileri Excel'in sayısal tarih formatından veya `DD.MM.YYYY` metin formatından `YYYY-MM-DD` formatına çevrilir.
3.  **Tekilleştirme Kontrolü (Duplicate Check):** `StockPage.tsx` üzerinde, her satır sisteme eklenmeden önce `materialName` ve `serialLotNumber` kombinasyonuna göre stokta olup olmadığı kontrol edilir. Zaten varsa atlanır.
4.  **Toplu Kayıt (Bulk Add):** Ayıklanan ve tekil olduğu doğrulanan tüm ürünler `storage.bulkAddStock` ile tek seferde stoka eklenir. Bu sayede işlem geçmişinde tek bir "Stok Ekleme" kaydı oluşur.

## Önemli Özellikler
*   **Esneklik:** Farklı departmanlardan veya tedarikçilerden gelen farklı Excel yapılarına uyum sağlar.
*   **Güvenlik:** Aynı seri/lot numarasının mükerrer (duplicate) girilmesini engeller.
*   **Hız:** Toplu ekleme (bulk action) performansı artırır.
