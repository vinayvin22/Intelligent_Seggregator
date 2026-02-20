import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import * as path from 'path';
import { promises as fs } from 'fs';

import { extractDate } from './services/dateExtractor';
import { detectCategory, initializeAI } from './services/categoryDetector';
import { organizeFile, getFileStructure, ensureDirectoryExists } from './services/fileOrganizer';
import { saveMetadata } from './services/metadataService';
import { DocumentState, ProcessingStatus } from './services/processingState';
import { dispatchProcessing } from './services/universalProcessor';

const app = express();
export default app;
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Initialize AI
const aiInitialized = initializeAI(process.env.GEMINI_API_KEY);
if (!aiInitialized) {
    console.log('Running without AI - using keyword-based category detection');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const tempDir = path.join(__dirname, 'temp');
        await ensureDirectoryExists(tempDir);
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // Increased limit to 50MB for general files
    }
});

/**
 * Main upload endpoint
 */
app.post('/api/upload', upload.array('files', 10), async (req: Request, res: Response) => {
    const results: any[] = [];

    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`Processing ${files.length} file(s)...`);

        for (const file of files) {
            console.log(`\nProcessing: ${file.originalname}`);

            // Initialize processing state
            const state = new DocumentState(file.originalname);
            state.transition(ProcessingStatus.UPLOADED);

            try {
                // Transition to PROCESSING
                state.transition(ProcessingStatus.PROCESSING);

                // Universal Processing Pipeline (Handles PDF, Image, Office, Media, Text, etc.)
                const pages = await dispatchProcessing(file.path, file.mimetype);

                state.transition(ProcessingStatus.CLASSIFIED, { pageCount: pages.length });

                // Process pages
                for (const page of pages) {
                    // Extract date
                    const date = extractDate(page.text) || new Date().toISOString().split('T')[0];
                    const category = await detectCategory(page.text);

                    console.log(`Page ${page.pageNumber}: Category=${category}, Date=${date}`);

                    const result = await organizeFile({
                        category,
                        date,
                        pageNumber: page.pageNumber,
                        pdfBytes: page.pdfBytes,
                        originalName: file.originalname,
                        textContent: page.text,
                        fileExtension: page.extension // Pass extension
                    }, UPLOAD_DIR);

                    state.transition(ProcessingStatus.STORED, {
                        filePath: result.filePath,
                        category,
                        date
                    });

                    results.push(result);
                }

                // Clean up temp file
                await fs.unlink(file.path).catch(() => { });

            } catch (error: any) {
                console.error(`Error processing ${file.originalname}:`, error);

                // Track failure state
                state.fail(error);

                // Persist failure metadata explicitly
                await saveMetadata({
                    originalFileName: file.originalname,
                    status: ProcessingStatus.FAILED,
                    error: error.message,
                    history: state.history // Save history audit trail
                });

                results.push({
                    error: `Failed to process ${file.originalname}: ${error.message}`,
                    fileName: file.originalname
                });
            }
        }

        // Get updated file structure
        const fileStructure = await getFileStructure(UPLOAD_DIR);

        res.json({
            success: true,
            message: `Processed ${files.length} file(s)`,
            results,
            fileStructure
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to process files',
            details: error.message
        });
    }
});

/**
 * Get current file structure
 */
app.get('/api/structure', async (req: Request, res: Response) => {
    try {
        const fileStructure = await getFileStructure(UPLOAD_DIR);
        res.json({ fileStructure });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        aiEnabled: aiInitialized,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

// Start server
app.listen(PORT, async () => {
    await ensureDirectoryExists(UPLOAD_DIR);
    await ensureDirectoryExists(path.join(__dirname, 'temp'));
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
    console.log(`🤖 AI Status: ${aiInitialized ? 'Enabled (Gemini)' : 'Disabled (Keyword-based)'}\n`);
});
