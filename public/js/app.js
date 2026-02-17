// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const structureSection = document.getElementById('structureSection');
const fileTree = document.getElementById('fileTree');
const resetBtn = document.getElementById('resetBtn');

// State
let selectedFiles = [];

// Event Listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
uploadBtn.addEventListener('click', handleUpload);
resetBtn.addEventListener('click', resetApp);

// Drag and Drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
});

uploadZone.addEventListener('click', (e) => {
    if (e.target === uploadZone || e.target.closest('.upload-icon') || e.target.closest('h2') || e.target.closest('p')) {
        fileInput.click();
    }
});

/**
 * Handle file selection from input
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

/**
 * Add files to selection
 */
function addFiles(files) {
    // Filter valid files
    const validFiles = files.filter(file => {
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            showError(`${file.name}: Invalid file type. Only PDF and images allowed.`);
            return false;
        }

        if (file.size > maxSize) {
            showError(`${file.name}: File too large. Max 10MB.`);
            return false;
        }

        return true;
    });

    selectedFiles = [...selectedFiles, ...validFiles];
    renderFileList();
    uploadBtn.disabled = selectedFiles.length === 0;
}

/**
 * Render file list
 */
function renderFileList() {
    if (selectedFiles.length === 0) {
        fileList.classList.remove('active');
        fileList.innerHTML = '';
        return;
    }

    fileList.classList.add('active');
    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-item-info">
                <div class="file-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                    </svg>
                </div>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFile(${index})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');
}

/**
 * Remove file from selection
 */
function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    uploadBtn.disabled = selectedFiles.length === 0;
}

/**
 * Handle file upload
 */
async function handleUpload() {
    if (selectedFiles.length === 0) return;

    // Show progress
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    structureSection.style.display = 'none';
    uploadBtn.disabled = true;

    // Create FormData
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    try {
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress <= 90) {
                progressFill.style.width = `${progress}%`;
            }
        }, 200);

        // Upload files
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();

        // Show results
        setTimeout(() => {
            progressSection.style.display = 'none';
            displayResults(data);
        }, 500);

    } catch (error) {
        console.error('Upload error:', error);
        progressSection.style.display = 'none';
        showError('Upload failed. Please try again.');
        uploadBtn.disabled = false;
    }
}

/**
 * Display results
 */
function displayResults(data) {
    resultsSection.style.display = 'block';
    structureSection.style.display = 'block';

    // Display individual results
    resultsContent.innerHTML = data.results.map(result => {
        if (result.error) {
            return `
                <div class="result-item error">
                    <div class="result-category">❌ Error</div>
                    <div class="result-details">${result.error}</div>
                </div>
            `;
        }

        return `
            <div class="result-item">
                <div class="result-category">📁 ${result.category}</div>
                <div class="result-details">
                    <strong><a href="/${result.filePath}" class="file-link" target="_blank">${result.fileName}</a></strong><br>
                    📅 Date: ${result.date} | 📄 Page: ${result.pageNumber}
                </div>
            </div>
        `;
    }).join('');

    // Build structure from current results only (batch view)
    const batchStructure = {};
    if (data.results) {
        data.results.forEach(result => {
            if (result.error) return;

            const dateKey = result.date || 'Unknown Date';
            if (!batchStructure[dateKey]) batchStructure[dateKey] = {};
            if (!batchStructure[dateKey][result.category]) batchStructure[dateKey][result.category] = [];

            batchStructure[dateKey][result.category].push({
                name: result.fileName,
                path: result.filePath
            });
        });
    }

    // Display file structure
    displayFileStructure(batchStructure);
}

/**
 * Display file structure tree
 */
function displayFileStructure(structure) {
    if (!structure || Object.keys(structure).length === 0) {
        fileTree.innerHTML = '<p style="color: var(--text-muted);">No files organized yet.</p>';
        return;
    }

    const dates = Object.keys(structure).sort().reverse();

    fileTree.innerHTML = dates.map(date => {
        const categories = structure[date];
        const categoryHtml = Object.entries(categories).map(([category, files]) => `
            <div class="tree-category">
                <div class="tree-category-name">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                    ${category} (${files.length})
                </div>
                ${files.map(file => `
                    <div class="tree-file">
                        └─ <a href="/${file.path}" class="file-link" target="_blank">${file.name}</a>
                    </div>
                `).join('')}
            </div>
        `).join('');

        return `
            <div class="tree-date-group" style="margin-bottom: 20px;">
                <div class="tree-date-header" style="font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; padding-bottom: 5px;">📅 ${date}</div>
                <div class="tree-date-content" style="padding-left: 10px;">${categoryHtml}</div>
            </div>
        `;
    }).join('');
}

/**
 * Reset application
 */
function resetApp() {
    selectedFiles = [];
    fileInput.value = '';
    renderFileList();
    uploadBtn.disabled = true;
    resultsSection.style.display = 'none';
    structureSection.style.display = 'none';
    progressSection.style.display = 'none';
    progressFill.style.width = '0%';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Show error message
 */
function showError(message) {
    // Simple alert for now - could be enhanced with toast notifications
    alert(message);
}

// Load existing file structure on page load
// Auto-load of existing structure disabled to enforce fresh state on refresh
/*
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/structure');
        const data = await response.json();
        if (data.fileStructure && Object.keys(data.fileStructure).length > 0) {
            structureSection.style.display = 'block';
            displayFileStructure(data.fileStructure);
        }
    } catch (error) {
        console.error('Failed to load file structure:', error);
    }
});
*/
