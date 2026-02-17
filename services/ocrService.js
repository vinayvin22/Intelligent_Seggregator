const Tesseract = require('tesseract.js');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;

/**
 * Extract text from scanned images or PDFs using OCR
 * @param {Buffer|string} imageSource - Image buffer or path
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imageSource) {
    try {
        console.log('Running OCR on image...');

        const { data: { text } } = await Tesseract.recognize(
            imageSource,
            'eng',
            {
                logger: info => {
                    if (info.status === 'recognizing text') {
                        // Suppress logs to avoid clutter
                    }
                }
            }
        );

        console.log('OCR completed');
        return text;
    } catch (error) {
        console.error('OCR Error:', error);
        return '';
    }
}

/**
 * Process image: Run OCR and embed in PDF
 * @param {string} filePath - Path to image file
 * @returns {Promise<Array>} Page object similar to pdfProcessor
 */
async function processImageToPdf(filePath) {
    // Run OCR
    const text = await extractTextFromImage(filePath);

    // Create PDF with image
    const imageBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    let image;
    const lowerPath = filePath.toLowerCase();

    try {
        if (lowerPath.endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBytes);
        } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
            image = await pdfDoc.embedJpg(imageBytes);
        } else {
            throw new Error('Unsupported image format for PDF conversion');
        }

        const { width, height } = image.scale(1);

        // Fit to page
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        // Scale down if larger than page
        const scaleFactor = Math.min((pageWidth - 40) / width, (pageHeight - 40) / height, 1);

        const scaledWidth = width * scaleFactor;
        const scaledHeight = height * scaleFactor;

        page.drawImage(image, {
            x: (pageWidth - scaledWidth) / 2,
            y: (pageHeight - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
        });

        const pdfBytes = await pdfDoc.save();

        return [{
            pageNumber: 0,
            text: text,
            pdfBytes: Buffer.from(pdfBytes),
            totalPages: 1
        }];
    } catch (error) {
        console.error('Error creating PDF from image:', error);
        // Return raw OCR text if PDF conversion fails, but empty pdfBytes? 
        // Need to be robust. Return empty PDF bytes or throw.
        throw error;
    }
}

module.exports = { extractTextFromImage, processImageToPdf };
