import AdmZip from 'adm-zip';
import { createPdfFromText } from './textProcessor';

/**
 * Process Archive files (ZIP).
 * Extracts file list and basic stats, converting them to a PDF summary.
 * 
 * @param filePath - Absolute path to the file
 * @param mimeType - Detected MIME type
 * @returns Standard page objects
 */
export async function processArchiveFile(filePath: string, mimeType: string): Promise<any[]> {
    let summary = `[Archive Processor] ${mimeType.toUpperCase()} file\n\n`;
    summary += `File Structure:\n`;
    summary += `----------------------------\n`;

    try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();

        zipEntries.forEach(entry => {
            const size = (entry.header.size / 1024).toFixed(2);
            summary += `${entry.isDirectory ? '📁' : '📄'} ${entry.entryName} (${size} KB)\n`;
        });

        summary += `\nTotal Files: ${zipEntries.length}\n`;

        return await createPdfFromText(summary);

    } catch (error: any) {
        summary += `Error reading archive: ${error.message}\n`;
        return await createPdfFromText(summary);
    }
}
