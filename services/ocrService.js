const Tesseract = require('tesseract.js');

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
                        console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
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

module.exports = { extractTextFromImage };
