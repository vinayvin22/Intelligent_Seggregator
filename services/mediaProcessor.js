const { createPdfFromText } = require('./textProcessor');

/**
 * Process Media files (Audio/Video).
 * Extracts metadata and stream info, converting it to a PDF summary.
 * 
 * @param {string} filePath - Absolute path to the file
 * @param {string} mimeType - Detected MIME type
 * @returns {Promise<Array>} Standard page objects
 */
async function processMediaFile(filePath, mimeType) {
    let summary = `[Media Processor] ${mimeType.toUpperCase()} file\n\n`;

    try {
        // Dynamic import for ESM-only 'music-metadata' package
        const mm = await import('music-metadata');
        const metadata = await mm.parseFile(filePath);

        summary += `Format: ${metadata.format.container || 'Unknown'}\n`;
        summary += `Duration: ${Math.round(metadata.format.duration || 0)}s\n`;
        summary += `Bitrate: ${Math.round((metadata.format.bitrate || 0) / 1000)} kbps\n`;
        summary += `Sample Rate: ${metadata.format.sampleRate || 'Unknown'} Hz\n`;

        if (metadata.common.title) summary += `Title: ${metadata.common.title}\n`;
        if (metadata.common.artist) summary += `Artist: ${metadata.common.artist}\n`;
        if (metadata.common.album) summary += `Album: ${metadata.common.album}\n`;

        summary += `\n[Transcription Status]: Ready for AI transcription (requires speech-to-text API integration).\n`;

        return await createPdfFromText(summary);

    } catch (error) {
        summary += `Error extracting metadata: ${error.message}\n`;
        return await createPdfFromText(summary);
    }
}

module.exports = { processMediaFile };
