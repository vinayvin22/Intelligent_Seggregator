/**
 * Enum for Document Processing Status
 * Ensures mutually exclusive and clearly defined states.
 */
const ProcessingStatus = {
    UPLOADED: 'UPLOADED',       // File received by server
    PROCESSING: 'PROCESSING',   // Content extraction/conversion in progress
    CLASSIFIED: 'CLASSIFIED',   // Category and Date detected
    STORED: 'STORED',           // File saved to final location
    FAILED: 'FAILED'            // Process encountered an unrecoverable error
};

/**
 * Manages the state lifecycle of a single document.
 * Provides safe transitions and error handling.
 */
class DocumentState {
    constructor(originalName) {
        this.originalName = originalName;
        this.status = ProcessingStatus.UPLOADED;
        this.history = [{ status: ProcessingStatus.UPLOADED, timestamp: new Date() }];
        this.error = null;
        this.metadata = {};
    }

    /**
     * Transition to a new state
     * @param {string} newStatus - One of ProcessingStatus
     * @param {Object} data - Optional data to merge into metadata
     */
    transition(newStatus, data = {}) {
        if (!ProcessingStatus[newStatus]) {
            console.error(`Invalid state transition: ${newStatus}`);
            return;
        }

        // Validate logical flow (simplified)
        if (this.status === ProcessingStatus.FAILED) {
            console.warn(`Cannot transition from FAILED to ${newStatus}`);
            return;
        }

        this.status = newStatus;
        this.history.push({ status: newStatus, timestamp: new Date() });
        Object.assign(this.metadata, data);

        console.log(`[State] ${this.originalName}: ${newStatus}`);
    }

    /**
     * Mark process as failed
     * @param {Error} error 
     */
    fail(error) {
        this.status = ProcessingStatus.FAILED;
        this.error = error.message;
        this.history.push({ status: ProcessingStatus.FAILED, timestamp: new Date(), error: error.message });
        console.error(`[State] ${this.originalName}: FAILED - ${error.message}`);
    }

    /**
     * Get current state snapshot
     */
    getSnapshot() {
        return {
            originalName: this.originalName,
            status: this.status,
            error: this.error,
            metadata: this.metadata,
            lastUpdate: new Date().toISOString()
        };
    }
}

module.exports = { ProcessingStatus, DocumentState };
