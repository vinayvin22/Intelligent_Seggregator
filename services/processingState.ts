/**
 * Enum for Document Processing Status
 * Ensures mutually exclusive and clearly defined states.
 */
export const ProcessingStatus = {
    UPLOADED: 'UPLOADED' as const,
    PROCESSING: 'PROCESSING' as const,
    CLASSIFIED: 'CLASSIFIED' as const,
    STORED: 'STORED' as const,
    FAILED: 'FAILED' as const
};

export type ProcessingStatusType = typeof ProcessingStatus[keyof typeof ProcessingStatus];

/**
 * Manages the state lifecycle of a single document.
 * Provides safe transitions and error handling.
 */
export class DocumentState {
    originalName: string;
    status: ProcessingStatusType;
    history: Array<{ status: ProcessingStatusType; timestamp: Date; error?: string }>;
    error: string | null;
    metadata: any;

    constructor(originalName: string) {
        this.originalName = originalName;
        this.status = ProcessingStatus.UPLOADED;
        this.history = [{ status: ProcessingStatus.UPLOADED, timestamp: new Date() }];
        this.error = null;
        this.metadata = {};
    }

    /**
     * Transition to a new state
     * @param newStatus - One of ProcessingStatus
     * @param data - Optional data to merge into metadata
     */
    transition(newStatus: ProcessingStatusType, data: any = {}) {
        if (!Object.values(ProcessingStatus).includes(newStatus)) {
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
     * @param error 
     */
    fail(error: Error) {
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
