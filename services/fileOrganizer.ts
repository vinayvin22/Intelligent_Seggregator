import { promises as fs } from 'fs';
import * as path from 'path';
import { saveMetadata } from './metadataService';

/**
 * Organize and save processed file
 * Hierarchy: Date -> Medical Category -> File
 */
export async function organizeFile(fileData: any, uploadDir: string): Promise<any> {
    const { category, date, pageNumber, pdfBytes, originalName, textContent } = fileData;

    // Create date directory (YYYY-MM-DD or Unknown Date)
    const dateStr = date || 'Unknown Date';
    const dateDir = path.join(uploadDir, dateStr);

    // Create category directory inside date directory
    const categoryDir = path.join(dateDir, category);

    await ensureDirectoryExists(categoryDir);

    // Generate filename: originalName_page1.ext
    const baseName = path.parse(originalName).name;
    const ext = fileData.fileExtension || '.pdf';
    const safeExt = ext.startsWith('.') ? ext : `.${ext}`;
    const fileName = `${baseName}_page${pageNumber + 1}${safeExt}`;
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
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Get file structure (recursively)
 */
export async function getFileStructure(uploadDir: string): Promise<any> {
    try {
        await ensureDirectoryExists(uploadDir);
        const structure: { [key: string]: { [key: string]: any[] } } = {};

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
