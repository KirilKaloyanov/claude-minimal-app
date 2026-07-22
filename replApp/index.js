import readline from 'readline/promises';
import { stdin as input, stdout as output} from 'process';
import { chat, addAssistantMessage, addUserMessage } from '../lib/claudeClient.js';

const rl = readline.createInterface({ input, output });
const messages = [];

while (true) {

    const input = await rl.question("Ask something (or type 'q' to quit) \n");

    if (input === 'q') break;

    addUserMessage(messages, input);

    const answer = await chat(messages);

    addAssistantMessage(messages, answer);

    console.log(answer);
}

rl.close();
