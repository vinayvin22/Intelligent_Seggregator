const { detectFileType } = require('./fileTypeDetector');
const { processPDF } = require('./pdfProcessor');
const { processImageToPdf } = require('./ocrService');
const { processTextFile, processJsonFile, processXMLFile, createPdfFromText } = require('./textProcessor');
const { processOfficeFile } = require('./officeProcessor');
const { processMediaFile } = require('./mediaProcessor');
const { processArchiveFile } = require('./archiveProcessor');
const path = require('path');

/**
 * The Universal Processing Pipeline.
 * Orchestrates file type detection and routes to the correct processor.
 * Ensures the system accepts ANY file format.
 * 
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} originalMime - Original MIME type from Multer
 * @returns {Promise<Array>} Standardized page objects for storage and indexing
 */
async function dispatchProcessing(filePath, originalMime) {
    // 1. Precise detection (header-based)
    const { mime, ext } = await detectFileType(filePath);
    console.log(`[Dispatcher] Detected: ${mime} (Original: ${originalMime})`);

    try {
        // 2. Routing Logic

        // PDF Handling
        if (mime === 'application/pdf') {
            return await processPDF(filePath);
        }

        // Image Handling (OCR)
        if (mime.startsWith('image/')) {
            return await processImageToPdf(filePath);
        }

        // Textual Handling
        if (mime === 'text/plain' || mime === 'text/markdown') {
            return await processTextFile(filePath);
        }
        if (mime === 'application/json') {
            return await processJsonFile(filePath);
        }
        if (mime === 'application/xml' || mime === 'text/xml') {
            return await processXMLFile(filePath);
        }

        // Office Handling (Word, Excel, CSV)
        if (mime.includes('wordprocessingml') || mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) {
            return await processOfficeFile(filePath, mime);
        }

        // Media Handling
        if (mime.startsWith('audio/') || mime.startsWith('video/')) {
            return await processMediaFile(filePath, mime);
        }

        // Archive Handling
        if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) {
            return await processArchiveFile(filePath, mime);
        }

        // 3. Robust Fallback (Binary/Unsupported)
        // Store metadata and provide a summary page to avoid system crash
        const filename = path.basename(filePath);
        let fallbackText = `[Universal Classifier] Unsupported Binary/Unknown format\n`;
        fallbackText += `Filename: ${filename}\n`;
        fallbackText += `MIME Type: ${mime}\n`;
        fallbackText += `Detected Ext: ${ext}\n\n`;
        fallbackText += `Content extraction is unavailable for this specific format.\n`;
        fallbackText += `The original file has been stored safely in the database.`;

        return await createPdfFromText(fallbackText);

    } catch (error) {
        console.error(`[Dispatcher] Error in pipeline: ${error.message}`);
        // Ensure we still pass something back to avoid breaking the organizing loop
        return await createPdfFromText(`[Critical Failure] Error processing ${path.basename(filePath)}: ${error.message}`);
    }
}

module.exports = { dispatchProcessing };
