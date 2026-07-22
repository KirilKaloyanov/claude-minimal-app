import { Anthropic } from "@anthropic-ai/sdk";

process.loadEnvFile();

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']
});

export const MODEL_MAPPING = Object.freeze({
    sonnet: 'claude-sonnet-4-5',
    haiku: 'claude-haiku-4-5-20251001'
});

/**
 * Inserts a new message from the user to the conversation
 * @param {Object[]} messages - An array holding all messages of the conversation
 * @param {string} content - The content of the user message 
 * @returns {void}
 */
function addUserMessage(messages, content) {
    const message = { role: 'user', content };
    messages.push(message);
}

/**
 * Inserts a new message from the LLM to the conversation
 * @param {Object[]} messages - An array holding all messages of the conversation
 * @param {string} content - The content of the message from the LLM
 * @returns {void}
 */
function addAssistantMessage(messages, content) {
    const message = { role: 'assistant', content };
    messages.push(message);
}

/**
 * Sends a request to the LLM and returns its answer
 * @param {Object[]} messages - An array holding all the messages of the conversation
 * @param {Object} [options] - An object which optionally provides configuration for the request
 * @param {keyof typeof MODEL_MAPPING} [options.model] - Choose the LLM to be used for the request Sonnet (default) or Haiku
 * @param {number} [options.maxTokens] - Overrides the default maximum tokens (1024) to be processed by the LLM
 * @param {string} [options.systemPrompt] - Provides a system prompt to be added to the request
 * @param {string[]} [options.stopSequences] - An array holding string(s) which terminate LLM generation when occurred
 * @returns {Promise<string>} - The answer of the LLM
 */
async function chat(messages, options = {}) {

    let model = MODEL_MAPPING[options.model] || MODEL_MAPPING.sonnet;
 
    const params = {
        max_tokens: options.maxTokens || 1024,
        messages,
        model
    };

    if (options.systemPrompt !== undefined) {
        params.system = options.systemPrompt;
    }

    if (options.stopSequences !== undefined) {
        params.stop_sequences = options.stopSequences;
    }

    const answer = await client.messages.create(params);

    if (answer.stop_reason === 'max_tokens') {
        console.warn(`[API warning] Response was truncated because it hit the limit of ${params.max_tokens}`);
    }

    return answer.content[0].text;
}

export {
    chat,
    addAssistantMessage,
    addUserMessage
};