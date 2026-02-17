const fs = require('fs').promises;
const path = require('path');

/**
 * Organize and save processed file
 * @param {Object} fileData - File data with category, date, and content
 * @param {string} uploadDir - Base upload directory
 * @returns {Promise<Object>} File organization result
 */
async function organizeFile(fileData, uploadDir) {
    const { category, date, pageNumber, pdfBytes, originalName } = fileData;

    // Create category directory
    const categoryDir = path.join(uploadDir, category);
    await ensureDirectoryExists(categoryDir);

    // Generate filename: originalName_date_pageX.pdf
    const baseName = path.parse(originalName).name;
    const fileName = `${baseName}_${date}_page${pageNumber}.pdf`;
    const filePath = path.join(categoryDir, fileName);

    // Save file
    await fs.writeFile(filePath, pdfBytes);

    console.log(`Saved: ${filePath}`);

    return {
        category,
        date,
        pageNumber,
        fileName,
        filePath: filePath.replace(/\\/g, '/')
    };
}

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch (error) {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

/**
 * Get organized file structure for display
 * @param {string} uploadDir - Base upload directory
 * @returns {Promise<Object>} File structure organized by category
 */
async function getFileStructure(uploadDir) {
    try {
        await ensureDirectoryExists(uploadDir);
        const categories = await fs.readdir(uploadDir);

        const structure = {};

        for (const category of categories) {
            const categoryPath = path.join(uploadDir, category);
            const stat = await fs.stat(categoryPath);

            if (stat.isDirectory()) {
                const files = await fs.readdir(categoryPath);
                structure[category] = files.map(file => ({
                    name: file,
                    path: path.join(categoryPath, file).replace(/\\/g, '/')
                }));
            }
        }

        return structure;
    } catch (error) {
        console.error('Error getting file structure:', error);
        return {};
    }
}

module.exports = { organizeFile, getFileStructure, ensureDirectoryExists };
