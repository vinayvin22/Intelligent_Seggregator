const fs = require('fs').promises;
const path = require('path');
const { saveMetadata } = require('./metadataService');

/**
 * Organize and save processed file
 * Hierarchy: Date -> Medical Category -> File
 */
async function organizeFile(fileData, uploadDir) {
    const { category, date, pageNumber, pdfBytes, originalName, textContent } = fileData;

    // Create date directory (YYYY-MM-DD or Unknown Date)
    const dateStr = date || 'Unknown Date';
    const dateDir = path.join(uploadDir, dateStr);

    // Create category directory inside date directory
    const categoryDir = path.join(dateDir, category);

    await ensureDirectoryExists(categoryDir);

    // Generate filename: originalName_page1.pdf
    const baseName = path.parse(originalName).name;
    const fileName = `${baseName}_page${pageNumber + 1}.pdf`;
    const filePath = path.join(categoryDir, fileName);

    // Save file
    await fs.writeFile(filePath, pdfBytes);

    console.log(`[Storage] Saved file to: ${filePath}`);

    // Save metadata to simulated DB
    await saveMetadata({
        originalFileName: originalName,
        pageNumber: pageNumber + 1,
        detectedDate: dateStr,
        normalizedCategory: category,
        filePath: filePath.replace(/\\/g, '/'),
        extractedTextPreview: textContent ? textContent.substring(0, 200) + '...' : ''
    });

    return {
        category,
        date: dateStr,
        pageNumber: pageNumber + 1,
        fileName,
        filePath: filePath.replace(/\\/g, '/')
    };
}

/**
 * Ensure directory exists
 */
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Get file structure (recursively)
 */
async function getFileStructure(uploadDir) {
    try {
        await ensureDirectoryExists(uploadDir);
        const structure = {};

        // Read dates
        const dates = await fs.readdir(uploadDir);

        for (const dateFolder of dates) {
            const datePath = path.join(uploadDir, dateFolder);
            const dateStat = await fs.stat(datePath);

            if (dateStat.isDirectory()) {
                // Read categories inside date
                const categories = await fs.readdir(datePath);

                for (const category of categories) {
                    const catPath = path.join(datePath, category);
                    const catStat = await fs.stat(catPath);

                    if (catStat.isDirectory()) {
                        const files = await fs.readdir(catPath);

                        // Structure: Date -> Category -> Files
                        if (!structure[dateFolder]) structure[dateFolder] = {};

                        structure[dateFolder][category] = files.map(file => ({
                            name: file,
                            path: path.join(catPath, file).replace(/\\/g, '/')
                        }));
                    }
                }
            }
        }

        return structure;
    } catch (error) {
        console.error('Error getting file structure:', error);
        return {};
    }
}

module.exports = { organizeFile, getFileStructure, ensureDirectoryExists };
