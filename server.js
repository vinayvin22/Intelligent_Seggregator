require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const { processPDF } = require('./services/pdfProcessor');
const { extractDate } = require('./services/dateExtractor');
const { detectCategory, initializeAI } = require('./services/categoryDetector');
const { organizeFile, getFileStructure, ensureDirectoryExists } = require('./services/fileOrganizer');
const { processTextFile, processJsonFile } = require('./services/textProcessor');
const { processImageToPdf } = require('./services/ocrService');
const { saveMetadata } = require('./services/metadataService');
const { DocumentState, ProcessingStatus } = require('./services/processingState');

const app = express();
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
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
    const results = [];

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`Processing ${req.files.length} file(s)...`);

        for (const file of req.files) {
            console.log(`\nProcessing: ${file.originalname}`);

            // Initialize processing state
            const state = new DocumentState(file.originalname);
            state.transition(ProcessingStatus.UPLOADED);

            try {
                // Transition to PROCESSING
                state.transition(ProcessingStatus.PROCESSING);

                // Process based on file type
                let pages = [];

                if (file.mimetype === 'application/pdf') {
                    pages = await processPDF(file.path);
                } else if (file.mimetype === 'text/plain') {
                    pages = await processTextFile(file.path);
                } else if (file.mimetype === 'application/json') {
                    pages = await processJsonFile(file.path);
                } else if (file.mimetype.startsWith('image/')) {
                    pages = await processImageToPdf(file.path);
                } else {
                    // Generic handler for all other file types
                    const buffer = await fs.readFile(file.path);
                    pages = [{
                        pageNumber: 0,
                        text: file.originalname, // Use filename as context
                        pdfBytes: buffer,
                        totalPages: 1,
                        extension: path.extname(file.originalname)
                    }];
                }

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

            } catch (error) {
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
            message: `Processed ${req.files.length} file(s)`,
            results,
            fileStructure
        });

    } catch (error) {
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
app.get('/api/structure', async (req, res) => {
    try {
        const fileStructure = await getFileStructure(UPLOAD_DIR);
        res.json({ fileStructure });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        aiEnabled: aiInitialized,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
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
