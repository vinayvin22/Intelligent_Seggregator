const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, '../database.json');

/**
 * Initialize the JSON database
 */
async function initDB() {
    try {
        await fs.access(DB_FILE);
    } catch {
        await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Save document metadata to the simulated database
 * @param {Object} metadata 
 */
async function saveMetadata(metadata) {
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
async function getAllMetadata() {
    await initDB();
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

module.exports = { saveMetadata, getAllMetadata };
