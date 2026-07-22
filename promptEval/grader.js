import { chat, addAssistantMessage, addUserMessage } from '../lib/claudeClient.js';
import { validateJavaScript, validateJson, validateRegex } from './validatros.js';


/**
 * Evaluates the output from a test case using the LLM
 * @param {{ task: string, format: string }} testCase The test case subject to grading
 * @param {string} output The output generated from the test case
 * @returns {Promise<number>} The model evaluation score (1-10)
 */
export async function gradeByModel(testCase, output) {
    const prompt = `
        You are an expert code reviewer. Evaluate this AI-generated solution.
        
        Task: ${testCase.task}
        Solution: ${output}
        
        Provide your evaluation as a structured JSON object with:
        - "strengths": An array of 1-3 key strengths
        - "weaknesses": An array of 1-3 key areas for improvement  
        - "reasoning": A concise explanation of your assessment
        - "score": A number between 1-10
    `;

    const messages = [];

    addUserMessage(messages, prompt);
    addAssistantMessage(messages, '```json');

    const result = await chat(messages, { stopSequences: ['```'] });

    try {
        const parsed = JSON.parse(result);

        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('LLM did not return JSON object');
        }

        if (typeof parsed.score !== 'number' || Number.isNaN(parsed.score)) {
            throw new Error(`Invalid score type: expected number, got ${typeof parsed.score}`);
        }

        if (parsed.score < 1 || parsed.score > 10) {
            throw new Error(`Score out of range [1-10]: got ${parsed.score}`);
        }

        return parsed.score;
    } catch (error) {
        console.error(`Failed to parse/validate LLM grading output. Raw result: "${result}". Error: ${error.message}`);

        return 5;
    }

}
/**
 * Evaluates the output from a test case using code validators
 * @param {{ task: string, format: string }} testCase The test case subject to grading
 * @param {string} output The output generated from the test case
 * @returns {number} The code validation score (0 or 10)
 */
export function gradeByCode(testCase, output) {
    const format = testCase.format;

    switch (format) {
        case 'regex':
            return validateRegex(output);
        case 'json':
            return validateJson(output);
        case 'javascript':
            return validateJavaScript(output);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}
