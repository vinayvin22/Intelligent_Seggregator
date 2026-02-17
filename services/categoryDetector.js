const { GoogleGenerativeAI } = require('@google/generative-ai');
const { normalizeCategory } = require('./categoryNormalizer');

// Initialize Gemini AI
let genAI;
let model;

function initializeAI(apiKey) {
    if (!apiKey) {
        console.warn('No Gemini API key provided. Category detection will use fallback method.');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('Gemini AI initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
        return false;
    }
}

/**
 * Detect medical category from document text using AI
 * @param {string} text - Document text
 * @returns {Promise<string>} Detected and normalized category
 */
async function detectCategory(text) {
    if (!text || text.trim().length < 10) {
        return 'General';
    }

    // Try AI detection first
    if (model) {
        try {
            const category = await detectWithAI(text);
            return normalizeCategory(category);
        } catch (error) {
            console.error('AI detection failed, using fallback:', error);
        }
    }

    // Fallback to keyword-based detection
    return detectWithKeywords(text);
}

/**
 * Detect category using Gemini AI
 * @param {string} text - Document text
 * @returns {Promise<string>} Detected category
 */
async function detectWithAI(text) {
    const prompt = `You are a medical document classifier. Analyze the following medical document text and identify which medical category it belongs to.

Available categories:
- Heart (cardiac reports, ECG, heart disease, coronary issues)
- Kidney (renal reports, creatinine, kidney function)
- Brain (neurological reports, MRI brain, cognitive tests)
- Eye (retina scans, vision tests, eye exams)
- Liver (liver function tests, hepatic reports)
- Lung (respiratory tests, chest X-rays, pulmonary function)
- Blood (blood tests, CBC, hemoglobin, glucose)
- Bone (X-rays, fractures, bone density, orthopedic)
- Thyroid (thyroid function tests, TSH, T3, T4)
- Diabetes (blood sugar, HbA1c, insulin)
- Skin (dermatology reports, skin tests)
- General (routine checkups, vitals, physical exams)

Document text:
${text.substring(0, 1000)}

Respond with ONLY the category name (one word). If you cannot determine the category, respond with "General".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim();

    console.log(`AI detected category: ${category}`);
    return category;
}

/**
 * Fallback keyword-based category detection
 * @param {string} text - Document text
 * @returns {string} Detected category
 */
function detectWithKeywords(text) {
    const lowerText = text.toLowerCase();

    // Define keyword patterns for each category
    const patterns = {
        'Heart': /\b(heart|cardiac|cardio|ecg|ekg|coronary|cardiovascular|myocardial|atrial|ventricular|arrhythmia|angina)\b/gi,
        'Kidney': /\b(kidney|renal|nephro|creatinine|urea|dialysis|nephrology)\b/gi,
        'Brain': /\b(brain|neuro|cerebral|cranial|mri brain|ct brain|stroke|seizure|neurology|epilepsy)\b/gi,
        'Eye': /\b(eye|ophthalm|retina|vision|visual|cataract|glaucoma|cornea|optic)\b/gi,
        'Liver': /\b(liver|hepatic|hepato|cirrhosis|hepatitis|jaundice|alt|ast|sgpt|sgot)\b/gi,
        'Lung': /\b(lung|pulmonary|respiratory|breathing|chest|bronchial|asthma|copd|pneumonia)\b/gi,
        'Blood': /\b(blood|hematology|hemoglobin|platelet|wbc|rbc|cbc|anemia|leukemia)\b/gi,
        'Bone': /\b(bone|orthopedic|skeletal|fracture|joint|arthritis|x-ray|xray|spine|osteoporosis)\b/gi,
        'Thyroid': /\b(thyroid|tsh|t3|t4|hyperthyroid|hypothyroid|goiter)\b/gi,
        'Diabetes': /\b(diabetes|diabetic|insulin|glucose|hba1c|blood sugar)\b/gi,
        'Skin': /\b(skin|dermatology|dermal|rash|eczema|psoriasis|melanoma|acne)\b/gi
    };

    // Count matches for each category
    let maxMatches = 0;
    let detectedCategory = 'General';

    for (const [category, pattern] of Object.entries(patterns)) {
        const matches = (lowerText.match(pattern) || []).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedCategory = category;
        }
    }

    console.log(`Keyword-based detection: ${detectedCategory} (${maxMatches} matches)`);
    return detectedCategory;
}

module.exports = { detectCategory, initializeAI };
