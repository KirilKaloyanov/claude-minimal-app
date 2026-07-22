import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join} from 'path';

import { chat, addAssistantMessage, addUserMessage } from '../lib/claudeClient.js';
import { gradeByCode, gradeByModel } from './grader.js';
import { retryWithBackoff } from '../utils/retryWithBackoff.js';
import dataset from "./dataset.json" with { type: 'json'};


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Runs the prompt with the test case and returns the result.
 * @param {{ task: string, format: string }} testCase - The test case which is being tested
 * @returns {Promise <string>} - The output from running the prompt with the testCase
 */

async function runPrompt(testCase) {

    const prompt = `
        Please, solve the following task: 

        ${testCase.task}
    `;

    const messages = [];
    addUserMessage(messages, prompt);
    addAssistantMessage(messages, '```' + testCase.format);

    const response = await retryWithBackoff(
        () => chat(messages, { stopSequences: ['```'] })
    );

    const filePath = join(__dirname, `res-${testCase.format}.md`) ;

    await writeFile(filePath, response, 'utf-8');

    return response;
}

/**
 * Generates a score from the prompt evaluation and returns it along with the prompt output and the initial test case
 * @param {{ task: string, format: string }} testCase - The test case which is being tested
 * @returns {Promise<{ success: boolean, output: string | null, testCase: { task: string, format: string }, score: number | null, error: string | null }>}
 */

async function runTestCase(testCase) {

    try {
        console.log(`Running test case ${testCase.format}...`);
        
        const output = await runPrompt(testCase);
        const modelScore = await gradeByModel(testCase, output);
        const codeScore = gradeByCode(testCase, output);

        const score = (modelScore + codeScore) / 2;

        console.log(`Test case ${testCase.format} finished. Model: ${modelScore}, Code: ${codeScore}, Final: ${score}`);
       
        return {
            success: true,
            passed: codeScore === 10, // Must pass syntax validation to count as passed
            output,
            testCase,
            score, 
            error: null
        };
        
    } catch (error) {
        console.error(`Test case ${testCase.format} failed: `, error.message);

        return {
            success: false,
            passed: false,
            output: null,
            testCase, 
            score: null,
            error: error.message
        };
    }
}


/**
 * Evaluates a dataset of test cases and produces the mean value of the successful runs
 * @param {Array<{ task: string, format: string }>} dataset - The dataset of test cases to evaluate
 * @returns {Promise<number>} - The mean score of successful evaluations
 */
async function runEvaluation(dataset) {
    const results = await Promise.allSettled(
        dataset.map(testCase => runTestCase(testCase))
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    
    // 1. Filter runs where the evaluator ran successfully (to compute the mean score)
    const completedRuns = fulfilled.filter(r => r.value.success);
    
    // 2. Count test passes vs test failures based on test assertions
    const passedRuns = completedRuns.filter(r => r.value.passed);
    const failedRuns = fulfilled.filter(r => !r.value.success || !r.value.passed);

    console.log('\n--- Evaluation complete ---\n');
    console.log(`Total: ${results.length} | Passed: ${passedRuns.length} | Failed: ${failedRuns.length}`);

    if (completedRuns.length === 0) 
        return 0;

    let totalScore = 0;

    for (let result of completedRuns) {
        totalScore += result.value.score;
    }

    const mean = totalScore / completedRuns.length;

    return mean;
}

async function main() {
    const finalScore = await runEvaluation(dataset);
    console.log("Final score: ", finalScore);
}

const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
    main().catch(error => {
        console.error("Fatal run error: ", error);
        process.exit(1);
    });
}

    