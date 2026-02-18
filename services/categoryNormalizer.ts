/**
 * Normalize medical category to prevent duplicates
 * Maps various medical terms to standardized categories
 */

export const categoryMappings: { [key: string]: string[] } = {
    // Heart related
    'heart': ['heart', 'cardiac', 'cardio', 'ecg', 'ekg', 'coronary', 'cardiovascular', 'myocardial', 'atrial', 'ventricular', 'heart disease', 'heart function', 'heart problem', 'heart attack', 'angina', 'arrhythmia'],

    // Kidney related
    'kidney': ['kidney', 'renal', 'nephro', 'creatinine', 'urea', 'kidney function', 'kidney disease', 'dialysis', 'urinary', 'nephrology'],

    // Brain related
    'brain': ['brain', 'neuro', 'cerebral', 'cranial', 'mri brain', 'ct brain', 'brain scan', 'neurological', 'cognitive', 'brain function', 'stroke', 'seizure', 'epilepsy', 'dementia'],

    // Eye related
    'eye': ['eye', 'ophthalm', 'ocular', 'retina', 'vision', 'visual', 'eye test', 'eye exam', 'cataract', 'glaucoma', 'cornea', 'pupil', 'lens'],

    // Liver related
    'liver': ['liver', 'hepatic', 'hepato', 'liver function', 'liver disease', 'cirrhosis', 'hepatitis', 'bile', 'jaundice', 'alt', 'ast', 'sgpt', 'sgot'],

    // Lung related
    'lung': ['lung', 'pulmonary', 'respiratory', 'breathing', 'chest', 'bronchial', 'asthma', 'copd', 'pneumonia', 'tuberculosis', 'tb', 'lung function', 'spirometry'],

    // Blood related
    'blood': ['blood', 'hematology', 'hemoglobin', 'platelet', 'wbc', 'rbc', 'blood test', 'cbc', 'complete blood count', 'anemia', 'leukemia', 'blood sugar', 'glucose', 'hba1c'],

    // Bone related
    'bone': ['bone', 'orthopedic', 'skeletal', 'fracture', 'osteo', 'joint', 'arthritis', 'bone density', 'x-ray', 'xray', 'spine', 'vertebra', 'calcium'],

    // Thyroid related
    'thyroid': ['thyroid', 'tsh', 't3', 't4', 'thyroid function', 'hyperthyroid', 'hypothyroid', 'goiter', 'thyroid gland'],

    // Diabetes related
    'diabetes': ['diabetes', 'diabetic', 'insulin', 'blood sugar', 'glucose', 'hba1c', 'fasting sugar', 'random sugar', 'ppbs'],

    // Skin related
    'skin': ['skin', 'dermatology', 'dermal', 'rash', 'eczema', 'psoriasis', 'acne', 'melanoma', 'skin test'],

    // General/Other
    'general': ['general', 'routine', 'checkup', 'physical', 'vitals', 'temperature', 'blood pressure', 'weight', 'height', 'bmi']
};

/**
 * Normalize category name to standard format
 * @param detectedCategory - Category detected by AI
 * @returns Normalized category name
 */
export function normalizeCategory(detectedCategory: string): string {
    if (!detectedCategory) return 'General';

    const lowerCategory = detectedCategory.toLowerCase().trim();

    // Check if it's already a standard category
    if (categoryMappings[lowerCategory]) {
        return capitalize(lowerCategory);
    }

    // Search through mappings to find match
    for (const [standardCategory, variations] of Object.entries(categoryMappings)) {
        for (const variation of variations) {
            if (lowerCategory.includes(variation) || variation.includes(lowerCategory)) {
                return capitalize(standardCategory);
            }
        }
    }

    // If no match found, return as General
    return 'General';
}

/**
 * Capitalize first letter
 * @param str - String to capitalize
 * @returns Capitalized string
 */
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
