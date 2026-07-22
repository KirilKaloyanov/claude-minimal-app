# Code Review: promptEval.js — Mid → Senior Gap Analysis

This review evaluates [promptEval.js](file:///c:/Users/KirilKaloyanov/CODE/Claude%20training/promptEval/promptEval.js) (and supporting files) through the lens of what separates a mid-level engineer from a senior one. The code *works* — and the concept (an LLM evaluation harness) is solid — but there are systematic patterns here that a senior would handle differently.

---

## 🔴 Critical Weaknesses

### 1. Zero Error Handling in the Core Pipeline

This is the single biggest red flag for senior-level readiness. The entire evaluation pipeline has **no try/catch, no retries, no graceful degradation**.

```javascript
// Line 86 — if the LLM returns malformed JSON, the whole process crashes
return (JSON.parse(result)).score;
```

```javascript
// Line 24 — if the API call fails (rate limit, timeout, network), unhandled rejection
const response = await chat(messages, { stopSequences: ['```'] });
```

**What a senior would do:**
- Wrap API calls with retry logic (exponential backoff for rate limits)
- Validate the parsed JSON has a `.score` property and that it's a number in range
- Return a structured error result instead of crashing, so one bad test case doesn't kill the entire evaluation run
- Separate recoverable errors (retry) from fatal errors (abort)

---

### 2. Security Vulnerability: Arbitrary Code Execution

```javascript
// Line 147 — this executes arbitrary LLM-generated code
new Function(text.trim());
```

`new Function()` compiles **and can execute** arbitrary code. You're passing untrusted LLM output directly into it. A senior engineer treats all external input — especially AI-generated content — as untrusted. This is essentially `eval()` in disguise.

> [!CAUTION]
> Even for a "validation only" use case, `new Function()` can have side effects during parsing of certain constructs. Use a proper AST parser like `acorn` or `esprima` for syntax validation without execution risk.

---

### 3. No Return Value from `default` Branch

```javascript
// Lines 92-103
switch (format) {
    case 'regex':
        return validateRegex(output);
    case 'json':
        return validateJson(output);
    case 'javascript':
        return validateJavaScript(output);
    default:
        console.log('No such ' + format);  // ← logs, but falls through to return 0
}
return 0;
```

The `default` case silently logs and falls through. A senior would:
- Throw an explicit error for unknown formats (`throw new Error(\`Unsupported format: ${format}\`)`)
- Or return a clearly "invalid" sentinel with context, not just `0` (which is indistinguishable from a legitimate failing score)

---

## 🟡 Architectural Weaknesses

### 4. Sequential Execution Where Parallel is Possible

```javascript
// Lines 116-119 — each test case waits for the previous one
for (let testCase of dataset) {
    const result = await runTestCase(testCase);
    results.push(result);
}
```

With 3 test cases, each involving 2 API calls (run + grade), you're making 6 sequential API calls. A senior would use `Promise.all` or `Promise.allSettled` (preferred — it doesn't fail-fast) with concurrency control:

```javascript
const results = await Promise.allSettled(
    dataset.map(testCase => runTestCase(testCase))
);
```

This is a **fundamental** async JavaScript concept that seniors are expected to reach for instinctively.

---

### 5. Hardcoded File Paths and Magic Values

```javascript
const filePath = `./promptEval/res-${testCase.format}.md`;  // Line 26
```
```javascript
max_tokens: 1624  // in index.js — why 1624?
```

Senior engineers parameterize these. The file path assumes the script is always run from a specific working directory. The `1624` token limit looks arbitrary with no explanation.

---

### 6. Grading Logic is Fragile (Binary 0 or 10)

```javascript
// All three validators return either 10 or 0
function validateJson(text) {
    try {
        JSON.parse(text.trim());
        return 10;   // ← perfect or nothing
    } catch (e) {
        return 0;
    }
}
```

This means `gradeByCode` has no nuance — output is either structurally perfect (10) or completely wrong (0). Then this binary score is averaged with the model's 1-10 score, which mathematically dominates the final result. A senior would recognize this as a **flawed scoring model** and either:
- Use a consistent scale with partial credit
- Weight the scores differently
- Or at minimum, document *why* binary scoring is intentional

---

### 7. The `runEvaluation` Function Lies About Its Return Type

```javascript
/**
 * @returns {Array<{ output: string, testCase: {...}, score: number }>}  ← says Array
 */
async function runEvaluation(dataset) {
    // ...
    return mean / results.length;  // ← actually returns a number
}
```

The JSDoc says it returns an array of result objects. It actually returns a single number (the mean score). **Documentation that contradicts the code is worse than no documentation** — it actively misleads.

---

## 🟠 Code Quality / Style Issues

### 8. Inconsistent Property Access Style

```javascript
testCase['task']    // Line 17 — bracket notation
testCase.format     // Line 22 — dot notation
testCase['format']  // Line 90 — bracket notation again
```

Pick one and be consistent. Dot notation is idiomatic JavaScript when the key is a valid identifier.

---

### 9. `console.log` as the Only Observability

Every diagnostic output is a `console.log`. A senior would use:
- A structured logger (e.g., `pino`, `winston`) with log levels
- Or at minimum, `console.error` for actual errors vs `console.log` for info

```javascript
console.log('No such ' + format);  // This is an error, not info
```

---

### 10. Top-Level Await With Side Effects

```javascript
// Line 130 — module-level execution
const response = await runEvaluation(dataset);
console.log(response);
```

This makes the module impossible to import without triggering the evaluation. A senior would wrap this in a `main()` function:

```javascript
async function main() {
    const response = await runEvaluation(dataset);
    console.log(response);
}

main().catch(console.error);
```

---

### 11. Unused Error Object in Catch Blocks

```javascript
catch (e) {
    return 0;  // 'e' is captured but never used — not even logged
}
```

Silently swallowing errors makes debugging nearly impossible. At minimum, log what went wrong.

---

## Summary: Your Mid → Senior Gap

| Dimension | Current Level | Senior Expectation |
|---|---|---|
| **Error handling** | Happy-path only | Defensive, with retries and graceful degradation |
| **Security awareness** | Not considered | Treat all external input as untrusted |
| **Async patterns** | Sequential `for` loops | `Promise.allSettled`, concurrency control |
| **Observability** | `console.log` | Structured logging, error categorization |
| **API design** | JSDoc contradicts code | Contracts match behavior, types are accurate |
| **Code organization** | Top-level side effects | Encapsulated `main()`, importable modules |
| **Scoring model design** | Binary (0/10) | Nuanced, well-reasoned, documented trade-offs |
| **Configuration** | Hardcoded paths/values | Parameterized, environment-aware |

> [!IMPORTANT]
> The #1 theme across all these issues is **defensive thinking**. A senior engineer doesn't just ask "does this work?" — they ask "how does this fail?", "what happens with bad input?", and "can someone else safely use/maintain this?". That mindset shift is the core of the mid → senior transition.

Your strengths: good use of prefilling for structured output, clean function decomposition, and JSDoc usage (even if one return type is wrong). The *architecture* of the evaluation harness — run → grade → aggregate — is well-structured. The gaps are in robustness, security, and production-mindedness.
