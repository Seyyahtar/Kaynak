
const EXTRACTION_PATTERNS = {
    SERI: /(?:SERI|SERİ):\s*([^\\/\\\\]+)/i,
    LOT: /LOT:\s*([^\\/\\\\]+)/i,
    SKT: /SKT:\s*(\d{2}[\.\/]\d{2}[\.\/]\d{4})/i,
    UBB: /UBB:\s*([^\\/\\\\]+)/i,
};

const testCases = [
    "LOT:25PCB00842\\SKT:31.08.2029",
    "SERI:81657631\\SKT:30.11.2027"
];

console.log("Starting Debug...");

testCases.forEach((val, idx) => {
    console.log(`\n--- Test Case ${idx + 1} ---`);
    console.log(`Value: "${val}"`);

    // Explicitly test LOT regex
    const lotMatch = val.match(EXTRACTION_PATTERNS.LOT);
    console.log("LOT Match Raw:", lotMatch ? lotMatch[0] : "null");
    console.log("LOT Captured:", lotMatch ? lotMatch[1] : "null");

    // Explicitly test SKT regex
    const sktMatch = val.match(EXTRACTION_PATTERNS.SKT);
    console.log("SKT Match Raw:", sktMatch ? sktMatch[0] : "null");
    console.log("SKT Captured:", sktMatch ? sktMatch[1] : "null");

    // Explicitly test SERI regex
    const seriMatch = val.match(EXTRACTION_PATTERNS.SERI);
    console.log("SERI Match Raw:", seriMatch ? seriMatch[0] : "null");
    console.log("SERI Captured:", seriMatch ? seriMatch[1] : "null");
});
