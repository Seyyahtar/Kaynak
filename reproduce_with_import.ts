
import { extractCombinedCellData, hasCombinedData, ExcelColumn } from './src/utils/excelParser';

const testCasesMatching = [
    "LOT:25PCB00842\\SKT:31.08.2029",
    "SERI:81657631\\SKT:30.11.2027"
];

console.log("--- Testing Actual Implementation ---");

testCasesMatching.forEach((val, idx) => {
    console.log(`\nTest Case ${idx + 1}: "${val}"`);

    const isCombined = hasCombinedData(val);
    console.log(`hasCombinedData: ${isCombined}`);

    const extracted = extractCombinedCellData(val);
    console.log(`extracted:`, extracted);
});
