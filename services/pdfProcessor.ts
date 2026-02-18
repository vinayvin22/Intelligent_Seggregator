import { PDFDocument } from 'pdf-lib';
import pdfParse from 'pdf-parse';
import { promises as fs } from 'fs';

/**
 * Split a multi-page PDF into individual pages and extract text from each
 * @param filePath - Path to the PDF file
 * @returns Array of page objects with text and page number
 */
export async function processPDF(filePath: string): Promise<any[]> {
    try {
        const dataBuffer = await fs.readFile(filePath);

        // Load PDF for splitting
        const pdfDoc = await PDFDocument.load(dataBuffer);
        const pageCount = pdfDoc.getPageCount();

        console.log(`Processing PDF with ${pageCount} pages`);

        const pages: any[] = [];

        // Process each page
        for (let i = 0; i < pageCount; i++) {
            // Create new PDF with single page
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);

            const pdfBytes = await newPdf.save();

            // Extract text from this specific page
            let pageText = '';
            try {
                const pageData = await pdfParse(Buffer.from(pdfBytes));
                pageText = pageData.text || '';
            } catch (err) {
                console.log(`Could not extract text from page ${i}, might be scanned`);
                pageText = '';
            }

            pages.push({
                pageNumber: i,
                text: pageText,
                pdfBytes: Buffer.from(pdfBytes), // Ensure it's a Buffer for consistent handling
                totalPages: pageCount
            });
        }

        return pages;
    } catch (error: any) {
        console.error('Error processing PDF:', error);
        throw new Error(`Failed to process PDF: ${error.message}`);
    }
}
