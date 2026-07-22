import Anthropic from "@anthropic-ai/sdk";

export class FatalError extends Error {
    constructor(message, originalError) {
        super(message); 
        this.name = 'FatalError';
        this.originalError = originalError;
    }
}

/**
 * 
 * @param {any} error - The caught error object 
 * @returns {boolean} True if the error is transient and can be retried.
 */
export function isRecoverableError(error) {
    if (
        error instanceof Anthropic.APIConnectionError ||
        error instanceof Anthropic.APIConnectionTimeoutError
    ) {
        return true;
    }

    if (error instanceof Anthropic.RateLimitError || error.status === 429) {
        if (error.message?.includes("billing") || error.message?.includes("credit")) {
            return false;
        }

        return true;
    }

    if (error.status && error.status >= 500 && error.status < 600) {
        return true;
    }

    return false;
}