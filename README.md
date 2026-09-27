# prompt-template-builder 🚀

[![npm version](https://img.shields.io/npm/v/prompt-template-builder.svg)](https://www.npmjs.com/package/prompt-template-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/swaraj792725/prompt-template-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/swaraj792725/prompt-template-builder/actions)

> **Ultra-fast, zero-dependency, type-safe prompt template engine for AI agents and LLMs.**  
> Designed for Anthropic Claude, OpenAI GPT-4, Gemini, Ollama, and Vercel AI SDK integrations.

---

## Features

- ⚡ **Zero External Dependencies**: Lightweight footprint, compatible with Node.js, Bun, Deno, and Edge Runtimes.
- 🎯 **Type-Safe Builder Pattern**: Fluent API to assemble multi-turn conversation messages (`system`, `user`, `assistant`, `developer`).
- 🛡️ **Prompt Injection Guardrails**: Built-in XML content escaping and template variable sanitization.
- 🏷️ **First-Class XML Tagging**: Seamlessly insert Anthropic/OpenAI recommended `<context>`, `<instructions>`, and `<documents>` tags.
- 🔢 **Token Estimator**: Quick heuristic token estimation without heavy tokenizer bundles.

---

## Installation

```bash
npm install prompt-template-builder
# or
pnpm add prompt-template-builder
# or
yarn add prompt-template-builder
```

---

## Quick Start

```typescript
import { createPromptBuilder } from 'prompt-template-builder';

const prompt = createPromptBuilder({ escapeXml: true })
  .system('You are an expert {{language}} developer assisting with code review.', {
    language: 'TypeScript',
  })
  .user('Please review the following module:')
  .xmlSection('code', 'function add(a: number, b: number): number { return a + b; }', {
    filename: 'math.ts',
  })
  .buildMessages();

console.log(prompt);
/*
Output:
[
  { role: 'system', content: 'You are an expert TypeScript developer assisting with code review.' },
  { role: 'user', content: 'Please review the following module:\n\n<code filename="math.ts">function add(a: number, b: number): number { return a + b; }</code>' }
]
*/
```

---

## Advanced Usage

### Variable Interpolation Styles

You can specify custom variable delimiters:

```typescript
// {{var}} (default), ${var}, or [var]
const builder = createPromptBuilder({ delimiterStyle: 'dollar-brace' });

builder.user('Hello ${name}, welcome to ${service}!', {
  name: 'Swaraj',
  service: 'Open Source',
});
```

### Integration with OpenAI & Anthropic SDKs

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { createPromptBuilder } from 'prompt-template-builder';

const builder = createPromptBuilder()
  .system('Synthesize the user query concisely.')
  .user('Explain quantum computing in 2 sentences.');

const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 300,
  messages: builder.buildMessages().filter(m => m.role !== 'system') as any,
  system: builder.buildMessages().find(m => m.role === 'system')?.content,
});
```

---

## API Reference

### `createPromptBuilder(options?: PromptTemplateOptions)`

Options:
- `delimiterStyle`: `'double-brace'` | `'dollar-brace'` | `'square-bracket'`
- `stripUnhandledVariables`: `boolean` (Default: `false`)
- `escapeXml`: `boolean` (Default: `false`)

### Methods

- `.system(template, variables?)`: Adds a system message.
- `.developer(template, variables?)`: Adds a developer message (for OpenAI o-series models).
- `.user(template, variables?)`: Adds a user message.
- `.assistant(template, variables?)`: Adds an assistant response.
- `.xmlSection(tagName, content, attributes?)`: Appends structured XML tag block.
- `.estimateTokens()`: Returns estimated token count.
- `.buildMessages()`: Returns standard message array.
- `.buildText()`: Returns single joined text prompt.
- `.clear()`: Clears history.

---

## Contributing

Contributions are warmly welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## License

[MIT](./LICENSE) © Swaraj Jakanoor
