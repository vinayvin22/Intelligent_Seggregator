import { promises as fs } from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as xml2js from 'xml2js';

/**
 * Process text file and convert to PDF
 */
export async function processTextFile(filePath: string): Promise<any[]> {
    const content = await fs.readFile(filePath, 'utf8');
    return await createPdfFromText(content);
}

/**
 * Process JSON file and convert to PDF
 */
export async function processJsonFile(filePath: string): Promise<any[]> {
    const content = await fs.readFile(filePath, 'utf8');
    let text = content;
    try {
        text = JSON.stringify(JSON.parse(content), null, 2);
    } catch (e) {
        // If invalid JSON, treat as text
    }
    return await createPdfFromText(text);
}

/**
 * Process XML file and convert to PDF
 */
export async function processXMLFile(filePath: string): Promise<any[]> {
    const content = await fs.readFile(filePath, 'utf8');
    let text = content;
    try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(content);
        text = JSON.stringify(result, null, 2);
    } catch (e) {
        // Fallback to raw text
    }
    return await createPdfFromText(text);
}

/**
 * Helper to create PDF from text content
 * Exported to be used by other processors (Office, Media, etc.)
 */
export async function createPdfFromText(text: string): Promise<any[]> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontSize = 10;
    const lineHeight = 12;
    const margin = 50;
    const maxLinesPerPage = Math.floor((height - 2 * margin) / lineHeight);

    // Basic text wrapping/sanitization
    const cleanText = text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, '');

    // Split lines
    const lines = cleanText.split('\n');
    let currentLineY = height - margin;
    let linesOnPage = 0;

    for (const line of lines) {
        if (linesOnPage >= maxLinesPerPage) {
            page = pdfDoc.addPage();
            currentLineY = height - margin;
            linesOnPage = 0;
        }

        // Draw line (truncating if too long for simplicity)
        const safeLine = line.substring(0, 100);

        page.drawText(safeLine, {
            x: margin,
            y: currentLineY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
        });

        currentLineY -= lineHeight;
        linesOnPage++;
    }

    const pdfBytes = await pdfDoc.save();

    return [{
        pageNumber: 0,
        text: text, // Return full original text for classification
        pdfBytes: Buffer.from(pdfBytes), // Ensure buffer
        totalPages: pdfDoc.getPageCount()
    }];
}
