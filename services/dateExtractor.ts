import { parse, isValid } from 'date-fns';

/**
 * Extract date from medical document text
 * @param text - Document text
 * @returns ISO date string or null
 */
export function extractDate(text: string): string | null {
    if (!text) return null;

    // Common date patterns in medical reports
    const datePatterns = [
        // DD/MM/YYYY or DD-MM-YYYY
        /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
        // MM/DD/YYYY or MM-DD-YYYY
        /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
        // YYYY-MM-DD
        /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,
        // DD Month YYYY (e.g., 15 January 2024)
        /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
        // Month DD, YYYY (e.g., January 15, 2024)
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi
    ];

    // Keywords that often precede dates in medical reports
    const dateKeywords = ['date:', 'report date:', 'test date:', 'examination date:', 'dated:', 'on:'];

    let bestDate: string | null = null;

    // Search for dates near keywords first (higher priority)
    for (const keyword of dateKeywords) {
        const keywordIndex = text.toLowerCase().indexOf(keyword);
        if (keywordIndex !== -1) {
            const contextText = text.substring(keywordIndex, keywordIndex + 100);
            const date = findDateInText(contextText, datePatterns);
            if (date && !bestDate) {
                bestDate = date;
            }
        }
    }

    // If no date found near keywords, search entire text
    if (!bestDate) {
        bestDate = findDateInText(text, datePatterns);
    }

    return bestDate;
}

/**
 * Find and parse date from text using patterns
 * @param text - Text to search
 * @param patterns - Regex patterns
 * @returns ISO date string
 */
function findDateInText(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const dateStr = match[0];
            const parsedDate = parseDate(dateStr);
            if (parsedDate) {
                return parsedDate;
            }
        }
    }
    return null;
}

/**
 * Parse date string to ISO format
 * @param dateStr - Date string
 * @returns ISO date string
 */
function parseDate(dateStr: string): string | null {
    const formats = [
        'dd/MM/yyyy',
        'dd-MM-yyyy',
        'MM/dd/yyyy',
        'MM-dd-yyyy',
        'yyyy-MM-dd',
        'yyyy/MM/dd',
        'dd MMMM yyyy',
        'MMMM dd, yyyy',
        'MMMM dd yyyy'
    ];

    for (const format of formats) {
        try {
            const date = parse(dateStr, format, new Date());
            if (isValid(date)) {
                return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
            }
        } catch (err) {
            continue;
        }
    }

    return null;
}
