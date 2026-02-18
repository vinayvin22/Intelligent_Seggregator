import * as Tesseract from 'tesseract.js';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { promises as fs } from 'fs';

/**
 * Extract text from scanned images or PDFs using OCR
 * @param imageSource - Image buffer or path
 * @returns Extracted text
 */
export async function extractTextFromImage(imageSource: Buffer | string): Promise<string> {
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
 * @param filePath - Path to image file
 * @returns Page object similar to pdfProcessor
 */
export async function processImageToPdf(filePath: string): Promise<any[]> {
    // Run OCR
    const text = await extractTextFromImage(filePath);

    // Create PDF with image
    const imageBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    let image: PDFImage;
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
        throw error;
    }
}
