# Intelligent Medical File Segregator

An AI-powered medical document organization system that automatically categorizes and organizes medical files by date and category.

## Features

- 📁 **Automatic Categorization**: AI-powered detection of medical categories (Heart, Kidney, Brain, Eye, etc.)
- 📅 **Date Extraction**: Automatically extracts report dates from documents
- 📄 **PDF Splitting**: Splits multi-page PDFs into individual pages for separate processing
- 🎨 **Premium UI**: Beautiful, modern interface with drag-and-drop support
- 🔄 **Batch Processing**: Upload multiple files at once
- 🏷️ **Category Normalization**: Prevents duplicate categories (e.g., "cardiac", "heart", "ECG" all map to "Heart")

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file and add your Gemini API key (optional - will use keyword-based detection if not provided):
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
UPLOAD_DIR=uploads
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Usage

1. Drag and drop medical files (PDF or images) onto the upload zone, or click to browse
2. Click "Upload & Process" to start processing
3. View the organized files by category and date
4. Files are saved in the `uploads/` directory organized by category

## File Organization

Files are organized in the following structure:
```
uploads/
├── Heart/
│   ├── report1_2024-01-15_page0.pdf
│   └── ecg_2024-02-20_page0.pdf
├── Kidney/
│   └── renal_report_2024-01-10_page0.pdf
└── Brain/
    └── mri_scan_2024-03-05_page0.pdf
```

## Supported Categories

- Heart (cardiac, ECG, coronary)
- Kidney (renal, creatinine)
- Brain (neurological, MRI brain)
- Eye (retina, vision tests)
- Liver (hepatic, liver function)
- Lung (pulmonary, respiratory)
- Blood (CBC, hemoglobin)
- Bone (X-ray, fractures)
- Thyroid (TSH, T3, T4)
- Diabetes (blood sugar, HbA1c)
- Skin (dermatology)
- General (routine checkups)

## Technologies Used

- **Backend**: Node.js, Express
- **PDF Processing**: pdf-lib, pdf-parse
- **OCR**: Tesseract.js
- **AI**: Google Gemini AI
- **Frontend**: Vanilla HTML, CSS, JavaScript

## License

ISC
