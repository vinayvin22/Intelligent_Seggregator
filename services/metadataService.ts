import { promises as fs } from 'fs';
import * as path from 'path';

const DB_FILE = path.join(__dirname, '../database.json');

/**
 * Initialize the JSON database
 */
async function initDB(): Promise<void> {
    try {
        await fs.access(DB_FILE);
    } catch {
        await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Save document metadata to the simulated database
 * @param metadata 
 */
export async function saveMetadata(metadata: any): Promise<any> {
    await initDB();
    try {
        const fileContent = await fs.readFile(DB_FILE, 'utf8');
        let data = [];
        try {
            data = JSON.parse(fileContent);
        } catch (e) {
            data = [];
        }

        const record = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...metadata,
            uploadTimestamp: new Date().toISOString()
        };

        data.push(record);
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
        console.log(`[Database] Saved metadata for ${metadata.originalFileName}`);
        return record;
    } catch (error) {
        console.error('[Database] Error saving metadata:', error);
        return null;
    }
}

/**
 * Get all metadata records
 */
export async function getAllMetadata(): Promise<any[]> {
    await initDB();
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}
