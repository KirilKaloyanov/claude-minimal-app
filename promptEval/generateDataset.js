import { writeFile } from 'fs/promises';
import { chat, addAssistantMessage, addUserMessage, MODEL_MAPPING } from "../lib/claudeClient.js";

const prompt = `
  Generate an evaluation dataset for a prompt evaluation. The dataset will be used to evaluate prompts that generate JavaScript, JSON, or Regex specifically for GCP-related tasks. Generate an array of JSON objects, each representing task that requires JavaScript, JSON, or a Regex to complete.

  Example output:
  \`\`\`json
  [
    {
      "task": "Description of task",
      "format": "'json' or 'javascript' or 'regex'"
    },
    ...additional
  ]
  \`\`\`

  * Focus on tasks that can be solved by writing a single javascript function, a single JSON object, or a single regex
  * Focus on tasks that do not require writing much code

  Please generate 3 objects.
`;

const messages = [];
addUserMessage(messages, prompt);
addAssistantMessage(messages, '```code');
const response = await chat(messages, { stopSequences: ['```'], model: "haiku" });

try {
  await writeFile('./promptEval/dataset.json', response, 'utf-8');
  console.log('Dataset successfully generated.');
} catch (error) {
  console.error("An error occured during dataset generation; ", error);
}


