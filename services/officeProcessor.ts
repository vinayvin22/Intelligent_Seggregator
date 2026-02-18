import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { createPdfFromText } from './textProcessor';

/**
 * Process Word, Excel, and CSV documents.
 * Extracts text and converts to PDF for unified storage.
 * 
 * @param filePath - Absolute path to the file
 * @param mimeType - Detected MIME type
 * @returns Standard page objects
 */
export async function processOfficeFile(filePath: string, mimeType: string): Promise<any[]> {
    let text = '';

    try {
        // Word Documents (.docx)
        if (mimeType.includes('wordprocessingml') || filePath.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        }
        // Excel Spreadsheets (.xlsx, .xls)
        else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
            const workbook = xlsx.readFile(filePath);
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                text += `Sheet: ${sheetName}\n`;
                text += xlsx.utils.sheet_to_txt(worksheet) + '\n\n';
            });
        }
        // CSV Files (using xlsx for consistent extraction)
        else if (mimeType.includes('csv') || filePath.endsWith('.csv')) {
            const workbook = xlsx.readFile(filePath);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            text = xlsx.utils.sheet_to_txt(firstSheet);
        }
        else {
            text = `[OfficeProcessor] Metadata only for ${mimeType}`;
        }

        if (!text || text.trim().length === 0) {
            text = `[OfficeProcessor] No text content could be extracted from this ${mimeType} file.`;
        }

        return await createPdfFromText(text);

    } catch (error: any) {
        console.error(`[OfficeProcessor] Error: ${error.message}`);
        return await createPdfFromText(`[OfficeProcessor] Error extracting content: ${error.message}`);
    }
}
