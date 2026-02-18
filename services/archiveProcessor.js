const AdmZip = require('adm-zip');
const { createPdfFromText } = require('./textProcessor');

/**
 * Process Archive files (ZIP).
 * Extracts file list and basic stats, converting them to a PDF summary.
 * 
 * @param {string} filePath - Absolute path to the file
 * @param {string} mimeType - Detected MIME type
 * @returns {Promise<Array>} Standard page objects
 */
async function processArchiveFile(filePath, mimeType) {
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

    } catch (error) {
        summary += `Error reading archive: ${error.message}\n`;
        return await createPdfFromText(summary);
    }
}

module.exports = { processArchiveFile };
