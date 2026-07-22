import * as esprima from 'esprima';

/**
 * Validates whether the given text is valid JSON.
 * @param {string} text - The JSON-formatted text to validate
 * @returns {number} Score: 10 if valid, 0 if invalid
 */
export function validateJson(text) {
    try {
        JSON.parse(text.trim());
        return 10;
    } catch (e) {
        console.error("ValidateJson failed with the following error ", e);
        return 0;
    }
}

/**
 * Validates whether the given text contains valid JavaScript code.
 * Uses esprima to check the AST structure without executing the code.
 * @param {string} text - The JavaScript code to validate
 * @returns {number} Score: 10 if valid, 0 if invalid
 */
export function validateJavaScript(text) {
    try {
        // Method 1: Built-in but executes nothing if it's just a syntax check
        esprima.parseScript(text.trim());
        return 10;
    } catch (e) {
        console.error("validateJavaScript failed with the following error ", e);
        return 0;
    }
}

/**
 * Validates whether the given text is a valid Regular Expression pattern.
 * @param {string} text - The regex pattern to validate
 * @returns {number} Score: 10 if valid, 0 if invalid
 */
export function validateRegex(text) {
    try {
        new RegExp(text.trim());
        return 10;
    } catch (e) {
        console.error("validateRegex failed with the following error ", e);
        return 0;
    }
}