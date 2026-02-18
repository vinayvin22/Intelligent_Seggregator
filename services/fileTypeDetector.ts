import * as path from 'path';

/**
 * Detect file MIME type robustly using magic bytes (Header inspection)
 * Falls back to file extension if magic bytes are unknown or detection fails.
 * 
 * @param filePath - Absolute path to the file
 * @returns Detected MIME type and extension
 */
export async function detectFileType(filePath: string): Promise<{ mime: string; ext: string }> {
    try {
        // Dynamic import for ESM-only 'file-type' package
        const { fileTypeFromFile }: any = await import('file-type');
        const fileType = await fileTypeFromFile(filePath);

        if (fileType) {
            return {
                mime: fileType.mime,
                ext: fileType.ext
            };
        }
    } catch (error) {
        // Using console.debug to avoid cluttering main logs unless verbose
        // console.debug(`[FileType] Magic byte detection skipped/failed: ${error.message}`);
    }

    // Fallback: Extension based detection
    const extRaw = path.extname(filePath).toLowerCase();
    const ext = extRaw.replace('.', '');

    const mimeMap: { [key: string]: string } = {
        'txt': 'text/plain',
        'csv': 'text/csv',
        'json': 'application/json',
        'xml': 'application/xml',
        'log': 'text/plain',
        'md': 'text/markdown',

        // Office
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

        // Archives
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',

        // Media
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'mkv': 'video/x-matroska',

        // Code
        'js': 'text/javascript',
        'html': 'text/html',
        'css': 'text/css',
        'py': 'text/x-python',
        'java': 'text/x-java-source'
    };

    return {
        mime: mimeMap[ext] || 'application/octet-stream', // Default binary
        ext: ext || 'bin'
    };
}
