import * as XLSX from 'xlsx';
import { FieldDataType } from '../types';

export interface ExcelColumn {
    name: string;
    dataType: FieldDataType;
    samples: any[];
}

export interface ParsedExcel {
    columns: ExcelColumn[];
    rows: any[][];
    headers: string[];
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

                // Detect column types
                const columns: ExcelColumn[] = headers.map((header, index) => {
                    const columnValues = dataRows.map(row => row[index]);
                    const samples = columnValues.slice(0, 3); // First 3 samples
                    const dataType = detectDataType(columnValues);

                    return {
                        name: String(header || `Sütun ${index + 1}`),
                        dataType,
                        samples
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
