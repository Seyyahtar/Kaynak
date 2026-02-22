import * as XLSX from "xlsx";
import { StockItem, ChecklistPatient, CaseRecord, HistoryRecord, ChecklistRecord, Product, CustomField } from "../types";
import { Filesystem, Directory } from '@capacitor/filesystem';

import { Share } from '@capacitor/share';
import { Capacitor } from "@capacitor/core";
import { FilePicker } from '@capawesome/capacitor-file-picker';

const toInitials = (fullName: string) => {
  if (!fullName) return '';
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part[0] || '').toUpperCase());
  return initials.length ? initials.join('.') : '';
};

// Stok için Excel içe aktarımı (3 farklı formatı destekler)
export const importFromExcel = (file: File): Promise<StockItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const stockItems: StockItem[] = [];

        // Header indekslerini bul
        const header = (jsonData[0] || []).map((h: any) => h?.toString().toLowerCase().trim());
        const findIndex = (key: string, fallback: number) => {
          const idx = header.findIndex((h: string) => h === key);
          return idx >= 0 ? idx : fallback;
        };

        // Formatı belirle
        const hasSerialLotColumn = header.includes("seri/lot no");
        const hasExpiryColumn = header.includes("s.k.t");
        const hasDescriptionColumn = header.includes("açıklama");
        const hasTrackingNumber = header.includes("takip numarası");

        let formatType = "";
        if (hasSerialLotColumn && hasExpiryColumn) {
          formatType = "output"; // Çıktı Tablosu
        } else if (hasDescriptionColumn) {
          formatType = "type2"; // 2.Tip Veri Tablosu
        } else if (hasTrackingNumber) {
          formatType = "type1"; // 1.Tip Veri Tablosu
        } else {
          // Fallback: eski format
          formatType = "legacy";
        }

        console.log("Tespit edilen format:", formatType);

        const parseQuantity = (value: any) => {
          if (value === undefined || value === null) return 0;
          const str = value.toString().replace(/[^0-9]/g, "");
          const num = parseInt(str, 10);
          return isNaN(num) ? 0 : num;
        };

        // Excel tarih formatından veya string formatından normal tarihe çevir
        const excelDateToJSDate = (excelDate: any) => {
          if (!excelDate) return "";
          const dateStr = excelDate.toString().trim();
          if (!dateStr || dateStr === "-") return "";

          // Eğer zaten GG.AA.YYYY veya YYYY-AA-GG formatındaysa
          const parts = dateStr.split(/[./-]/);
          if (parts.length === 3) {
            let day, month, year;
            if (parts[0].length === 4) { // YYYY-MM-DD
              [year, month, day] = parts;
            } else if (parts[2].length === 4) { // DD.MM.YYYY
              [day, month, year] = parts;
            } else if (parts[0].length === 2 && parts[2].length === 2) { // DD.MM.YY
              [day, month, year] = parts;
              year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
            }

            if (day && month && year) {
              return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
          }

          // Sayısal Excel formatı kontrolü
          const num = parseInt(dateStr, 10);
          // Gerçekçi bir ürün tarihi (2000 sonrası) > 36000 olmalı.
          // Küçük sayılar (örn: 30) muhtemelen yanlış parse edilmiş GG.AA.YYYY verisidir.
          if (isNaN(num) || num < 1000) return "";

          // Excel'in 1900 leap year bug düzeltmesi
          const adjustedNum = num > 59 ? num - 1 : num;
          const date = new Date((adjustedNum - 1) * 24 * 60 * 60 * 1000 + Date.UTC(1900, 0, 1));
          return date.toISOString().split("T")[0];
        };

        // İlk satır başlık olduğu için 1'den başla
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          let materialCode = "";
          let materialName = "";
          let ubbCode = "";
          let serialLotNumber = "";
          let expiryDate = "";
          let quantity = 0;

          if (formatType === "output") {
            // Çıktı Tablosu formatı
            materialCode = row[findIndex("malzeme kodu", 1)]?.toString().trim() || "";
            materialName = row[findIndex("malzeme açıklaması", 2)]?.toString().trim() || "";

            const ubbIndex = header.indexOf("ubb kodu");
            ubbCode = ubbIndex >= 0
              ? row[ubbIndex]?.toString().trim() || ""
              : "";

            serialLotNumber = row[findIndex("seri/lot no", 4)]?.toString().trim() || "";
            const expiryDateRaw = row[findIndex("s.k.t", 5)];
            expiryDate = excelDateToJSDate(expiryDateRaw);
            quantity = parseQuantity(row[findIndex("miktar", 6)]);

          } else if (formatType === "type2") {
            // 2.Tip Veri Tablosu formatı
            materialCode = row[findIndex("malzeme kodu", 1)]?.toString().trim() || "";
            materialName = row[findIndex("malzeme açıklaması", 2)]?.toString().trim() || "";

            const ubbIndex = header.indexOf("ubb kodu");
            ubbCode = ubbIndex >= 0
              ? row[ubbIndex]?.toString().trim() || ""
              : "";

            const descriptionCell = row[findIndex("açıklama", 4)]?.toString().trim() || "";
            quantity = parseQuantity(row[findIndex("miktar", 5)]);

            // Açıklama alanından parse et
            const parts = descriptionCell.split("\\");
            parts.forEach((part: string) => {
              const cleanPart = part.trim();

              const lotMatch = cleanPart.match(/^LOT:(.+)$/i);
              if (lotMatch) {
                serialLotNumber = lotMatch[1].trim();
                return;
              }

              const seriMatch = cleanPart.match(/^SERI:(.+)$/i);
              if (seriMatch) {
                serialLotNumber = seriMatch[1].trim();
                return;
              }

              const sktMatch = cleanPart.match(/^SKT:(.+)$/i);
              if (sktMatch) {
                const dateStr = sktMatch[1].trim();
                const dateParts = dateStr.split(/[\/.]/);
                if (dateParts.length === 3) {
                  const day = dateParts[0].padStart(2, "0");
                  const month = dateParts[1].padStart(2, "0");
                  const year = dateParts[2];
                  expiryDate = `${year}-${month}-${day}`;
                }
                return;
              }

              const ubbMatch = cleanPart.match(/^UBB:(.+)$/i);
              if (ubbMatch) {
                ubbCode = ubbMatch[1].trim();
              }
            });

          } else if (formatType === "type1") {
            // 1.Tip Veri Tablosu formatı
            materialCode = row[findIndex("malzeme kodu", 0)]?.toString().trim() || "";
            serialLotNumber = row[findIndex("takip numarası", 1)]?.toString().trim() || "";
            materialName = row[findIndex("malzeme açıklaması", 2)]?.toString().trim() || "";
            const expiryDateRaw = row[findIndex("son kullanma tarihi", 4)];
            expiryDate = excelDateToJSDate(expiryDateRaw);
            quantity = parseQuantity(row[findIndex("miktar", 3)]);

          } else {
            // Legacy format (eski açıklama tabanlı)
            materialCode = row[findIndex("malzeme kodu", 1)]?.toString().trim() || "";
            materialName = row[findIndex("malzeme açıklaması", 2)]?.toString().trim() || "";
            const descriptionCell = row[findIndex("açıklama", 4)]?.toString().trim() || "";
            quantity = parseQuantity(row[findIndex("miktar", 5)]);

            // Açıklama hücresini parse et
            const parts = descriptionCell.split("\\");
            parts.forEach((part: string) => {
              const cleanPart = part.trim();

              const lotMatch = cleanPart.match(/^LOT:(.+)$/i);
              if (lotMatch) {
                serialLotNumber = lotMatch[1].trim();
                return;
              }

              const seriMatch = cleanPart.match(/^SERI:(.+)$/i);
              if (seriMatch) {
                serialLotNumber = seriMatch[1].trim();
                return;
              }

              const sktMatch = cleanPart.match(/^SKT:(.+)$/i);
              if (sktMatch) {
                const dateStr = sktMatch[1].trim();
                const dateParts = dateStr.split(/[\/.]/);
                if (dateParts.length === 3) {
                  const day = dateParts[0].padStart(2, "0");
                  const month = dateParts[1].padStart(2, "0");
                  const year = dateParts[2];
                  expiryDate = `${year}-${month}-${day}`;
                }
                return;
              }

              const ubbMatch = cleanPart.match(/^UBB:(.+)$/i);
              if (ubbMatch) {
                ubbCode = ubbMatch[1].trim();
              }
            });

            if (!serialLotNumber && descriptionCell) {
              serialLotNumber = descriptionCell;
            }
          }

          if (!materialName || quantity <= 0) continue;

          const stockItem: StockItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            materialName,
            serialLotNumber,
            ubbCode,
            expiryDate,
            quantity,
            dateAdded: new Date().toISOString().split("T")[0],
            from: "Excel içe aktarma",
            to: "",
            materialCode: materialCode || undefined,
          };

          stockItems.push(stockItem);
        }

        resolve(stockItems);
      } catch (error) {
        reject(new Error("Excel dosyası okunamadı: " + error));
      }
    };

    reader.onerror = () => {
      reject(new Error("Dosya okunamadı"));
    };

    reader.readAsBinaryString(file);
  });
};

// Vaka kayıtlarından implant listesi dışa aktar
export const exportImplantList = async (
  cases: CaseRecord[],
  products: Product[],
  currentUser: string,
  filename: string = "implant_listesi.xlsx",
  templateData?: ArrayBuffer | null
) => {
  try {
    if (!templateData) {
      throw new Error("İmplant şablon dosyası seçilmedi");
    }

    const targetHeaders = [
      "document date",
      "customername",
      "implanter",
      "patient",
      "material name",
      "quantity",
      "serial no #",
    ];

    const workbook = XLSX.read(templateData, {
      type: "array",
      cellStyles: true,
      cellFormula: true,
      cellNF: true,
      bookVBA: true,
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error("Şablon sayfası okunamadı");
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][];

    const normalize = (v: any) => v?.toString().trim().toLowerCase();
    const matchesHeader = (cell: any, target: string) => {
      const n = normalize(cell);
      if (!n) return false;
      return n === target || n.replace(/\s+/g, "") === target.replace(/\s+/g, "");
    };

    const headerRowIndex = rows.findIndex((row) =>
      targetHeaders.filter((h) =>
        row.some((cell) => matchesHeader(cell, h))
      ).length >= 3
    );

    const headerRow = headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0] || [];
    const headerMap: Record<string, number> = {};

    targetHeaders.forEach((h) => {
      const idx = headerRow.findIndex((c) => matchesHeader(c, h));
      if (idx >= 0) headerMap[h] = idx;
    });

    if (Object.keys(headerMap).length < 4) {
      throw new Error("Şablon beklenen sütun başlıklarını içermiyor");
    }

    const startRow =
      headerRowIndex >= 0 ? headerRowIndex + 1 : rows.length;

    const entries = cases.flatMap((c) =>
      c.materials.map((m) => {
        let formattedDate = c.date;
        const dateObj = new Date(c.date);
        if (!isNaN(dateObj.getTime())) {
          const d = dateObj.getDate().toString().padStart(2, '0');
          const mo = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const y = dateObj.getFullYear();
          formattedDate = `${d}.${mo}.${y}`;
        }

        const product = products.find(p => p.name === m.materialName);

        return {
          documentDate: formattedDate,
          customerName: c.hospitalName,
          implanter: c.doctorName,
          patient: c.patientName,
          materialName: product ? product.name : m.materialName, // Ürün katalogda varsa oradaki adını, yoksa stoktaki adını yaz
          quantity: m.quantity,
          serialNo: m.serialLotNumber,
        };
      })
    );

    if (entries.length === 0) {
      throw new Error("Aktarılacak vaka verisi bulunamadı");
    }

    entries.forEach((e, i) => {
      const r = startRow + i;

      const set = (key: string, value: any, type: "s" | "n" = "s") => {
        const c = headerMap[key];
        if (c === undefined) return;
        const addr = XLSX.utils.encode_cell({ r, c });

        let finalValue = value ?? "";
        let finalType = type;

        if (!worksheet[addr]) {
          worksheet[addr] = { t: finalType, v: finalValue };
        } else {
          // Preserve existing cell metadata (formatting/styles) if present
          worksheet[addr].t = finalType;
          worksheet[addr].v = finalValue;
        }
      };

      set("document date", e.documentDate);
      set("customername", e.customerName);
      set("implanter", e.implanter);
      set("patient", e.patient);
      set("material name", e.materialName);
      set("quantity", e.quantity, "n");
      set("serial no #", e.serialNo);
    });

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    range.e.r = Math.max(range.e.r, startRow + entries.length - 1);
    worksheet["!ref"] = XLSX.utils.encode_range(range);

    /* 🌐 WEB: Direkt indir */
    if (Capacitor.getPlatform() === "web") {
      XLSX.writeFile(workbook, filename);
      return {
        success: true,
        message: "Dosya başarıyla indirildi",
        uri: null
      };
    }

    /* 📱 MOBILE: */
    if (Capacitor.getPlatform() !== "web") {
      // Base64 formatında Excel dosyasını oluştur
      const base64 = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      // Önce Cache'e kaydet
      const timestamp = new Date().toISOString()
        .slice(0, 19)
        .replace(/[:]/g, "-")
        .replace("T", "_");
      const finalFilename = `implant_listesi_${timestamp}.xlsx`;

      const tempFile = await Filesystem.writeFile({
        path: finalFilename,
        data: base64,
        directory: Directory.Cache,
      });

      // Sonra External Storage'ın Download klasörüne kopyala
      const downloadPath = `Download/${finalFilename}`;
      await Filesystem.writeFile({
        path: downloadPath,
        data: base64,
        directory: Directory.ExternalStorage,
      });

      const successMessage = `İmplant listesi başarıyla Download klasörüne kaydedildi: ${downloadPath}`;

      return {
        success: true,
        message: successMessage,
        uri: downloadPath
      };
    }
  } catch (error) {
    console.error("İmplant listesi export hatası:", error);
    return {
      success: false,
      message: (error as Error).message || "Bilinmeyen bir hata oluştu",
      uri: null
    };
  }
};

// Stok verilerini Excel'e aktar
export const exportToExcel = async (
  stockItems: StockItem[],
  filename: string = "stok_listesi.xlsx"
) => {
  try {
    const excelData = stockItems.map((item, index) => ({
      "Sıra No": index + 1,
      "Malzeme Kodu": item.materialCode || "",
      "Malzeme Açıklaması": item.materialName,
      "UBB KODU": item.ubbCode || "",
      "Seri/Lot No": item.serialLotNumber || "",
      "S.K.T": item.expiryDate ? (() => {
        const d = new Date(item.expiryDate);
        return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
      })() : "",
      "Miktar": item.quantity,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 8 },   // Sıra No
      { wch: 15 },  // Malzeme Kodu
      { wch: 30 },  // Malzeme Açıklaması
      { wch: 20 },  // UBB KODU
      { wch: 15 },  // Seri/Lot No
      { wch: 12 },  // S.K.T
      { wch: 10 },  // Miktar
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sayfa1");

    if (Capacitor.getPlatform() === "web") {
      XLSX.writeFile(workbook, filename);
      return;
    }

    if (Capacitor.getPlatform() !== "web") {
      const base64 = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      // Önce Cache'e kaydet
      const tempFile = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      // Sonra External Storage'ın Download klasörüne kopyala
      const downloadPath = `Download/${filename}`;
      await Filesystem.writeFile({
        path: downloadPath,
        data: base64,
        directory: Directory.ExternalStorage,
      });

      alert(`Excel dosyası başarıyla Download klasörüne kaydedildi: ${downloadPath}`);
    }

  } catch (error) {
    console.error("Excel export error:", error);
    alert("Excel dosyası kaydedilirken hata oluştu: " + (error as Error).message);
  }
};

// Kontrol listesi için Excel'den hasta verisi içe aktar
export const importChecklistFromExcel = (file: File): Promise<ChecklistPatient[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const patients: ChecklistPatient[] = [];

        const formatExcelTime = (value: any): string => {
          if (!value) return "";
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue < 1) {
            const totalMinutes = Math.round(numValue * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          }
          const timeStr = value.toString().trim();
          return timeStr.replace(/:\d{2}$/, "");
        };

        // Excel tarih formatından normal tarihe çevir (1900-01-01 = 1)
        const normalizeExcelDate = (excelDate: any) => {
          if (!excelDate) return "";

          // Eğer zaten YYYY-MM-DD formatındaysa dokunma
          if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
            return excelDate;
          }

          // Eğer DD.MM.YYYY formatındaysa çevir
          if (typeof excelDate === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(excelDate)) {
            const parts = excelDate.split('.');
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }

          const num = parseInt(excelDate.toString(), 10);
          if (isNaN(num) || num < 1) {
            // Belki bir Date objesidir veya başka bir string
            try {
              const d = new Date(excelDate);
              if (!isNaN(d.getTime())) {
                return d.toISOString().split("T")[0];
              }
            } catch (e) { }
            return excelDate.toString();
          }

          const date = new Date((num - 1) * 24 * 60 * 60 * 1000 + new Date(1900, 0, 1).getTime());
          return date.toISOString().split("T")[0]; // YYYY-MM-DD format
        };

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const name = row[0]?.toString().trim() || "";
          const note = row[1]?.toString().trim() || "";
          const phone = row[2]?.toString().trim() || "";
          const city = row[3]?.toString().trim() || "";
          const hospital = row[4]?.toString().trim() || "";
          const date = normalizeExcelDate(row[5]);
          const time = formatExcelTime(row[6]);

          if (!name) continue;

          const patient: ChecklistPatient = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name,
            note: note || undefined,
            phone: phone || undefined,
            city: city || undefined,
            hospital: hospital || undefined,
            date: date || undefined,
            time: time || undefined,
            checked: false,
          };

          patients.push(patient);
        }

        resolve(patients);
      } catch (error) {
        reject(new Error("Excel dosyası okunamadı: " + error));
      }
    };

    reader.onerror = () => {
      reject(new Error("Dosya okunamadı"));
    };

    reader.readAsBinaryString(file);
  });
};
export const exportHistoryToExcel = async (
  historyRecords: HistoryRecord[],
  filename: string = "gecmis_kayitlari.xlsx"
) => {
  try {
    const excelData = historyRecords.map((record, index) => ({
      "Sıra No": index + 1,
      "Tarih": new Date(record.date).toLocaleDateString('tr-TR'),
      "Tür": record.type === 'stock-add' ? 'Stok Ekleme' :
        record.type === 'stock-remove' ? 'Stok Çıkarma' :
          record.type === 'stock-delete' ? 'Stok Silme' :
            record.type === 'case' ? 'Vaka' :
              record.type === 'checklist' ? 'Kontrol Listesi' : record.type,
      "Açıklama": record.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 8 },   // Sıra No
      { wch: 12 },  // Tarih
      { wch: 15 },  // Tür
      { wch: 50 },  // Açıklama
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Geçmiş Kayıtları");

    if (Capacitor.getPlatform() === "web") {
      XLSX.writeFile(workbook, filename);
      return;
    }

    if (Capacitor.getPlatform() !== "web") {
      const base64 = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      // Önce Cache'e kaydet
      const tempFile = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      // Sonra External Storage'ın Download klasörüne kopyala
      const downloadPath = "Download/";
      await Filesystem.writeFile({
        path: downloadPath,
        data: base64,
        directory: Directory.ExternalStorage,
      });

      alert(`Geçmiş kayıtları başarıyla Download klasörüne kaydedildi: ${downloadPath}`);
    }

  } catch (error) {
    throw new Error('Excel dışa aktarma hatası: ' + (error as Error).message);
  }
};


export const shareHistoryToExcel = async (
  historyRecords: HistoryRecord[]
) => {
  try {
    const excelData = historyRecords.map((record, index) => {
      let details = "";

      if (record.details) {
        if (record.type === "stock-add" || record.type === "stock-remove" || record.type === "stock-delete") {
          const item = record.details as StockItem;
          details = `Malzeme: ${item.materialName}, Seri/Lot: ${item.serialLotNumber}, UBB: ${item.ubbCode || "-"}, SKT: ${item.expiryDate}, Miktar: ${item.quantity}`;
          if (item.from) details += `, Kimden: ${item.from}`;
          if (item.to) details += `, Kime: ${item.to}`;
        } else if (record.type === "case") {
          const caseData = record.details as CaseRecord;
          details = `Hasta: ${caseData.patientName}, Hastane: ${caseData.hospitalName}, Doktor: ${caseData.doctorName}`;
          if (caseData.notes) details += `, Notlar: ${caseData.notes}`;
          if (caseData.materials && caseData.materials.length > 0) {
            details += `, Malzemeler: ${caseData.materials.map(m => `${m.materialName} (${m.quantity})`).join(", ")}`;
          }
        } else if (record.type === "checklist") {
          const checklist = record.details as ChecklistRecord;
          const checkedCount = checklist.patients.filter(p => p.checked).length;
          details = `Başlık: ${checklist.title}, Toplam Hasta: ${checklist.patients.length}, Kontrol Edilen: ${checkedCount}`;
        }
      }

      return {
        "Sıra No": index + 1,
        "Tarih": new Date(record.date).toLocaleDateString("tr-TR"),
        "Tür": record.type === "stock-add" ? "Stok Ekleme" :
          record.type === "stock-remove" ? "Stok Çıkarma" :
            record.type === "stock-delete" ? "Stok Silme" :
              record.type === "case" ? "Vaka" :
                record.type === "checklist" ? "Kontrol Listesi" : record.type,
        "Açıklama": record.description,
        "Detaylar": details,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 8 },   // Sıra No
      { wch: 12 },  // Tarih
      { wch: 15 },  // Tür
      { wch: 50 },  // Açıklama
      { wch: 100 }, // Detaylar
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Geçmiş Kayıtları");

    const base64 = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "base64",
    });

    const filename = `gecmis_kayitlari_${new Date().toISOString().split("T")[0]}.xlsx`;

    if (Capacitor.getPlatform() === "web") {
      // Web için blob oluştur ve download
      const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Mobil için Cache"e kaydet ve paylaş
      const tempFile = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });
      const fileUri = tempFile.uri;
      await Share.share({
        title: "Geçmiş Kayıtları",
        files: [fileUri],
      });
    }

  } catch (error) {
    throw new Error("Excel paylaşma hatası: " + (error as Error).message);
  }
};

export const exportProductsToExcel = async (
  products: Product[],
  fields: CustomField[],
  filename: string = "urun_listesi.xlsx"
) => {
  try {
    // 1. Prepare Headers (Dynamic)
    const headers: string[] = ["Sıra No", "Ürün Adı"];
    const fieldMap = new Map<string, string>(); // Header Name -> Field ID

    // Add visible active fields
    fields.forEach(f => {
      if (f.isActive) {
        headers.push(f.name);
        fieldMap.set(f.name, f.id);
      }
    });

    // 2. Map Data
    const excelData = products.map((product, index) => {
      const row: any = {
        "Sıra No": index + 1,
        "Ürün Adı": product.name,
      };

      // Fill dynamic fields
      fields.forEach(f => {
        if (f.isActive) {
          let value = '';
          // Check standard fields first
          switch (f.id) {
            case 'quantity': value = product.quantity !== undefined ? product.quantity.toString() : ''; break;
            case 'serial_number': value = product.serialNumber || ''; break;
            case 'lot_number': value = product.lotNumber || ''; break;
            case 'expiry_date': value = product.expiryDate || ''; break;
            case 'ubb_code': value = product.ubbCode || ''; break;
            case 'product_code': value = product.productCode || ''; break;
            default:
              // Custom fields
              value = product.customFields[f.id] || '';
          }
          row[f.name] = value;
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headers });

    // Auto-width for columns (rough estimate)
    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));
    colWidths[1] = { wch: 40 }; // Ürün Adı wider
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürün Listesi");

    // 3. Save/Share
    if (Capacitor.getPlatform() === "web") {
      XLSX.writeFile(workbook, filename);
      return;
    }

    if (Capacitor.getPlatform() !== "web") {
      const base64 = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      // Cache
      const tempFile = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      // Share
      const fileUri = tempFile.uri;
      await Share.share({
        title: "Ürün Listesi",
        text: "Ürün listesi ektedir.",
        files: [fileUri],
      });

      // Backup to Download
      try {
        const downloadPath = `Download/${filename}`;
        await Filesystem.writeFile({
          path: downloadPath,
          data: base64,
          directory: Directory.ExternalStorage,
        });
      } catch (e) {
        console.warn("Yedekleme hatası (önemsiz):", e);
      }
    }

  } catch (error) {
    console.error("Ürün listesi export hatası:", error);
    throw new Error("Excel dosyası oluşturulurken hata: " + (error as Error).message);
  }
};
