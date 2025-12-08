// Excel işlemleri için yardımcı fonksiyonlar
import * as XLSX from "xlsx";
import { StockItem, ChecklistPatient, CaseRecord } from "../types";

const toInitials = (fullName: string) => {
  if (!fullName) return '';
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part[0] || '').toUpperCase());
  return initials.length ? initials.join('.') : '';
};

// Stok için Excel içe aktarımı
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

        // Header indekslerini bul (başlık değişirse fallback olarak eski sıralar kullanılır)
        const header = (jsonData[0] || []).map((h: any) => h?.toString().toLowerCase().trim());
        const findIndex = (key: string, fallback: number) => {
          const idx = header.findIndex((h: string) => h === key);
          return idx >= 0 ? idx : fallback;
        };

        const idxMaterialCode = findIndex("malzeme kodu", 1);
        const idxMaterialName = findIndex("malzeme açıklaması", 2);
        const idxUbb = findIndex("ubb kodu", 3);
        const idxDescription = findIndex("açıklama", 4);
        const idxQuantity = findIndex("miktar", 5);

        const parseQuantity = (value: any) => {
          if (value === undefined || value === null) return 0;
          const num = parseInt(value.toString().replace(/[^0-9-]/g, ""), 10);
          return isNaN(num) ? 0 : num;
        };

        // İlk satır başlık olduğu için 1'den başla
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const materialCode = row[idxMaterialCode]?.toString().trim() || "";
          const materialName = row[idxMaterialName]?.toString().trim() || "";
          const descriptionCell = row[idxDescription]?.toString().trim() || "";
          const quantity = parseQuantity(row[idxQuantity]);

          if (!materialName || quantity <= 0) continue;

          // Açıklama hücresini parse et
          let serialLotNumber = "";
          let expiryDate = "";
          let ubbCode = row[idxUbb]?.toString().trim() || "";

          const parts = descriptionCell.split("\\");
          parts.forEach((part) => {
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
              return;
            }
          });

          if (!serialLotNumber && descriptionCell) {
            serialLotNumber = descriptionCell;
          }

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

// Vaka kayýtlarýndan implant listesi dýþa aktar (hazýr Excel þablonu ile)
export const exportImplantList = (
  cases: CaseRecord[],
  currentUser: string,
  filename: string = 'implant_list.xlsx',
  templateData?: ArrayBuffer | null
) => {
  if (!templateData) {
    throw new Error('İmplant şablon dosyası seçilmedi');
  }

  const targetHeaders = [
    'document date',
    'customername',
    'implanter',
    'patient',
    'material name',
    'quantity',
    'serial no #',
  ];

  const workbook = XLSX.read(templateData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('Şablon sayfası okunamadı');
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  const normalize = (value: any) => value?.toString().trim().toLowerCase();
  const matchesHeader = (cell: any, target: string) => {
    const norm = normalize(cell);
    if (!norm) return false;
    if (norm === target) return true;
    return norm.replace(/\s+/g, '') === target.replace(/\s+/g, '');
  };

  const headerRowIndex = rows.findIndex((row) => {
    const hits = targetHeaders.filter((h) =>
      row.some((cell: any) => matchesHeader(cell, h))
    );
    return hits.length >= 3;
  });

  const headerRow = headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0] || [];
  const headerMap: Record<string, number> = {};
  targetHeaders.forEach((h) => {
    const idx = headerRow.findIndex((cell: any) => matchesHeader(cell, h));
    if (idx >= 0) headerMap[h] = idx;
  });

  if (Object.keys(headerMap).length < 4) {
    throw new Error('Şablon beklenen sütun başlıklarını içermiyor');
  }

  const findFirstEmptyRow = () => {
    for (let r = (headerRowIndex >= 0 ? headerRowIndex + 1 : 1); r < rows.length; r++) {
      const row = rows[r] || [];
      const hasData = targetHeaders.some((h) => {
        const c = headerMap[h];
        if (c === undefined) return false;
        const value = row[c];
        return value !== '' && value !== undefined && value !== null;
      });
      if (!hasData) return r;
    }
    return rows.length;
  };

  const startRow = findFirstEmptyRow();
  const buildEntries = () =>
    cases.flatMap((caseRecord) =>
      caseRecord.materials.map((m) => ({
        'Document Date': caseRecord.date,
        CustomerName: caseRecord.hospitalName,
        Implanter: caseRecord.doctorName,
        Patient: caseRecord.patientName,
        'Material Name': m.materialName,
        Quantity: m.quantity,
        'Serial No #': m.serialLotNumber,
      }))
    );

  const entries = buildEntries();
  if (entries.length === 0) {
    throw new Error('Aktarılacak vaka verisi bulunamadı');
  }

  const valueKeyMap: Record<string, string> = {
    'document date': 'Document Date',
    customername: 'CustomerName',
    implanter: 'Implanter',
    patient: 'Patient',
    'material name': 'Material Name',
    quantity: 'Quantity',
    'serial no #': 'Serial No #',
  };

  entries.forEach((entry, idx) => {
    const rowNumber = startRow + idx;
    targetHeaders.forEach((key) => {
      const colIndex = headerMap[key];
      if (colIndex === undefined) return;
      const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowNumber });
      const valueKey = valueKeyMap[key];
      const value = valueKey ? (entry as any)[valueKey] ?? '' : '';

      if (key === 'quantity' && typeof value === 'number') {
        worksheet[cellAddress] = { t: 'n', v: value };
      } else {
        worksheet[cellAddress] = { t: 's', v: value };
      }
    });
  });

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  range.e.r = Math.max(range.e.r, startRow + entries.length - 1);
  worksheet['!ref'] = XLSX.utils.encode_range(range);

  // Tarihi tabloya yazarken sadece hücreleri dolduruyoruz, diğer sütunlar şablondaki gibi kalıyor
  XLSX.writeFile(workbook, filename);
};

// Stok verilerini Excel'e aktar
export const exportToExcel = (stockItems: StockItem[], filename: string = "stok_listesi.xlsx") => {
  const excelData = stockItems.map((item, index) => {
    const descriptionParts: string[] = [];

    if (item.serialLotNumber) {
      const isNumericOnly = /^\d+$/.test(item.serialLotNumber);
      if (isNumericOnly) {
        descriptionParts.push(`SERI:${item.serialLotNumber}`);
      } else {
        descriptionParts.push(`LOT:${item.serialLotNumber}`);
      }
    }

    if (item.expiryDate) {
      const date = new Date(item.expiryDate);
      const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${date.getFullYear()}`;
      descriptionParts.push(`SKT:${formattedDate}`);
    }

    if (item.ubbCode) {
      descriptionParts.push(`UBB:${item.ubbCode}`);
    }

    const description = descriptionParts.join("\\");

    return {
      "Sıra": index + 1,
      "Malzeme": item.materialCode || "",
      "Malzeme Açıklaması": item.materialName,
      "Açıklama": description,
      "Miktar": item.quantity,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 30 },
    { wch: 50 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Listesi");
  XLSX.writeFile(workbook, filename);
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

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const name = row[0]?.toString().trim() || "";
          const note = row[1]?.toString().trim() || "";
          const phone = row[2]?.toString().trim() || "";
          const city = row[3]?.toString().trim() || "";
          const hospital = row[4]?.toString().trim() || "";
          const date = row[5]?.toString().trim() || "";
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
