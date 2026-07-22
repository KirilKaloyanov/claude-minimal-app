import { isRecoverableError } from "./errors.js";
import { FatalError } from "./errors.js";


/**
 * Retries an asynchronous operation with exponential backoff and jitter.
 * 
 * @template T
 * @param {() => Promise<T>} fn - The async operation to perform.
 * @param {Object} options
 * @param {number} [options.retries = 3] - Maximum number of retries
 * @param {number} [options.delay = 1000] - Initial delay in miliseconds
 * @param {number} [options.factor = 2] - Multiplier by which the delay increases.
 * @returns {Promise<T>} 
 */

export async function retryWithBackoff(fn, { retries = 3, delay = 1000, factor = 2 } = {}) {
    try {
        return await fn();
    } catch (error) {
        if (!isRecoverableError(error)) {
            throw new FatalError(`Fatal API error occurred: ${error.message}`, error);
        }

        // If we ran out of retries fail immmedieately
        if (retries <= 0) {
            throw new Error(`Max retries reached. Original error: ${error.message}`);
        }

        // Add 'jitter' (random noise) to the delay to prevent synchronized retries (thundering herd)
        const jitter = Math.random() * 200;
        const nextDelay = delay * factor + jitter;

        console.warn(`API call failed. Retrying in ${Math.round(nextDelay)}ms ... (${retries} retries left. Error: ${error.message})`);

        await new Promise(resolve => setTimeout(resolve, delay));

        return retryWithBackoff(fn, {
            retries: retries - 1,
            delay: nextDelay,
            factor
        });
    }
}