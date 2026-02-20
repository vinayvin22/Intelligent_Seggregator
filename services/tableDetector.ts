/**
 * Detects if a piece of text contains structured table-like data.
 * Uses heuristics like column alignment, recurring delimiters, and table headers.
 */
export function detectTable(text: string): boolean {
    if (!text || text.trim().length < 20) return false;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) return false; // Too short for a meaningful table

    let score = 0;

    // 1. Check for common table header keywords in medical reports
    const tableHeaders = [
        /\b(test|parameter|result|unit|range|reference)\b/i,
        /\b(date|particulars|description|amount|quantity|total)\b/i,
        /\b(s\.no|sl\.no|index|type|status|value)\b/i
    ];

    // 2. Check for alignment patterns (multiple spaces, tabs, or pipes)
    const alignmentPatterns = [
        /\w+\s{3,}\w+/,       // Multiple spaces between words
        /\w+\t\w+/,           // Tabs
        /\|/,                  // Pipes
        /\d+\.\d+\s+\w+/      // Number followed by unit-like text
    ];

    // 3. Sequential row patterns
    let detectedRows = 0;
    for (const line of lines) {
        // Check if line looks like a table row (contains multiple columns)
        const columns = line.split(/\s{2,}|\t|\|/).filter(c => c.trim().length > 0);
        if (columns.length >= 2) {
            detectedRows++;
        }

        // Search for headers
        for (const headerPattern of tableHeaders) {
            if (headerPattern.test(line)) {
                score += 2;
                break;
            }
        }
    }

    // Heuristic: If more than 40% of lines look like table rows
    if (detectedRows / lines.length > 0.4) {
        score += 5;
    }

    // Heuristic: If we found specific alignment patterns
    for (const pattern of alignmentPatterns) {
        if (pattern.test(text)) {
            score += 3;
            break;
        }
    }

    console.log(`[TableDetector] Score: ${score}, Rows: ${detectedRows}/${lines.length}`);

    // Threshold for being a table
    return score >= 7;
}
