import * as XLSX from 'xlsx';
import { FieldDataType } from '../types';

export interface ExtractedCellData {
    seri?: string;
    lot?: string;
    skt?: string;
    ubb?: string;
}

export interface ExcelColumn {
    name: string;
    dataType: FieldDataType;
    samples: any[];
    hasCombinedData?: boolean;
    extractedSamples?: ExtractedCellData[];
}

export interface ParsedExcel {
    columns: ExcelColumn[];
    rows: any[][];
    headers: string[];
}

/**
 * Regex patterns for extracting data from combined cells
 */
const EXTRACTION_PATTERNS = {
    SERI: /(?:SERI|SERİ):\s*([^\\/\\\\]+)/i,
    LOT: /LOT:\s*([^\\/\\\\]+)/i,
    SKT: /SKT:\s*(\d{2}[\.\/]\d{2}[\.\/]\d{4})/i,
    UBB: /UBB:\s*([^\\/\\\\]+)/i,
};

/**
 * Extracts LOT, SKT, and UBB data from a combined cell value
 * Example: "LOT:ABC123 / SKT:01.12.2025 / UBB:9876543210"
 */
export function extractCombinedCellData(cellValue: any): ExtractedCellData | null {
    if (!cellValue || typeof cellValue !== 'string') return null;

    const value = cellValue.toString().trim();
    if (!value) return null;

    const extracted: ExtractedCellData = {};
    let hasAnyData = false;

    // Extract SERI
    const seriMatch = value.match(EXTRACTION_PATTERNS.SERI);
    if (seriMatch) {
        extracted.seri = seriMatch[1].trim();
        hasAnyData = true;
    }

    // Extract LOT
    const lotMatch = value.match(EXTRACTION_PATTERNS.LOT);
    if (lotMatch) {
        extracted.lot = lotMatch[1].trim();
        hasAnyData = true;
    }

    // Extract SKT (Son Kullanma Tarihi)
    const sktMatch = value.match(EXTRACTION_PATTERNS.SKT);
    if (sktMatch) {
        const dateStr = sktMatch[1];
        const dateParts = dateStr.split(/[\.\/]/);
        if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            extracted.skt = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
            hasAnyData = true;
        }
    }

    // Extract UBB
    const ubbMatch = value.match(EXTRACTION_PATTERNS.UBB);
    if (ubbMatch) {
        extracted.ubb = ubbMatch[1].trim();
        hasAnyData = true;
    }

    return hasAnyData ? extracted : null;
}

/**
 * Checks if a cell contains combined data (multiple fields in one cell)
 */
export function hasCombinedData(cellValue: any): boolean {
    if (!cellValue || typeof cellValue !== 'string') return false;

    const value = cellValue.toString().trim();
    const matchCount = [
        EXTRACTION_PATTERNS.SERI.test(value),
        EXTRACTION_PATTERNS.LOT.test(value),
        EXTRACTION_PATTERNS.SKT.test(value),
        EXTRACTION_PATTERNS.UBB.test(value),
    ].filter(Boolean).length;

    return matchCount >= 2; // At least 2 patterns found means combined data
}

/**
 * Detects the data type of a column based on sample values
 */
function detectDataType(values: any[]): FieldDataType {
    const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');

    if (nonEmptyValues.length === 0) return 'text';

    let hasNumber = false;
    let hasText = false;
    let hasDate = false;

    for (const value of nonEmptyValues.slice(0, 10)) { // Check first 10 values
        const strValue = String(value).trim();

        // Check if it's a number
        if (!isNaN(Number(strValue)) && strValue !== '') {
            hasNumber = true;
        }
        // Check if it's a date
        else if (!isNaN(Date.parse(strValue))) {
            hasDate = true;
        }
        // Otherwise it's text
        else {
            hasText = true;
        }
    }

    // Determine type based on what we found
    if (hasDate && !hasNumber && !hasText) return 'date';
    if (hasNumber && !hasText && !hasDate) return 'number';
    if (hasText || (hasNumber && hasText)) return 'mixed';

    return 'text';
}

/**
 * Parses an Excel file and returns structured data
 */
export async function parseExcelFile(file: File): Promise<ParsedExcel> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON (array of objects)
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: '',
                    raw: false
                });

                if (jsonData.length === 0) {
                    reject(new Error('Excel dosyası boş'));
                    return;
                }

                // First row is headers
                const headers = jsonData[0] as string[];
                const dataRows = jsonData.slice(1);

                // Detect column types and extract combined data
                const columns: ExcelColumn[] = headers.map((header, index) => {
                    const columnValues = dataRows.map(row => row[index]);
                    const samples = columnValues.slice(0, 3); // First 3 samples
                    const dataType = detectDataType(columnValues);

                    // Check if this column contains combined data
                    const combinedDataDetected = columnValues.some(val => hasCombinedData(val));

                    // Extract combined data from samples if present
                    let extractedSamples: ExtractedCellData[] | undefined;

                    if (combinedDataDetected) {
                        const allSamples: ExtractedCellData[] = [];
                        const typeCounts = { seri: 0, lot: 0, skt: 0, ubb: 0 };
                        const MAX_SAMPLES = 5; // Max samples per type to collect

                        for (const val of columnValues) {
                            const extracted = extractCombinedCellData(val);
                            if (extracted) {
                                let isUseful = false;
                                if (extracted.seri && typeCounts.seri < MAX_SAMPLES) { typeCounts.seri++; isUseful = true; }
                                if (extracted.lot && typeCounts.lot < MAX_SAMPLES) { typeCounts.lot++; isUseful = true; }
                                if (extracted.skt && typeCounts.skt < MAX_SAMPLES) { typeCounts.skt++; isUseful = true; }
                                if (extracted.ubb && typeCounts.ubb < MAX_SAMPLES) { typeCounts.ubb++; isUseful = true; }

                                if (isUseful) {
                                    allSamples.push(extracted);
                                }

                                // Optimization: If we have enough samples for all types found so far, maybe stop? 
                                // But we don't know if new types appear later. 
                                // Since Excel files are client-side limit usually reasonable, scanning all is fine.
                            }
                        }
                        extractedSamples = allSamples.length > 0 ? allSamples : undefined;
                    }

                    return {
                        name: String(header || `Sütun ${index + 1}`),
                        dataType,
                        samples,
                        hasCombinedData: combinedDataDetected,
                        extractedSamples
                    };
                });

                resolve({
                    columns,
                    rows: dataRows,
                    headers
                });
            } catch (error) {
                reject(new Error('Excel dosyası okunamadı: ' + (error as Error).message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Dosya okunamadı'));
        };

        reader.readAsBinaryString(file);
    });
}

/**
 * Validates file before parsing
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const validExtensions = ['.xls', '.xlsx'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
        return { valid: false, error: 'Sadece Excel dosyaları (.xls, .xlsx) desteklenir' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' };
    }

    return { valid: true };
}
