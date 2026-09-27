import { describe, it, expect } from 'vitest';
import {
  formatFileContext,
  formatSnippetContext,
  formatSystemInstructions,
  PromptBuilder,
} from '../src/index.js';

describe('Codebase Context & System Instructions', () => {
  it('formats file context into structural XML tags', () => {
    const fileXml = formatFileContext('src/builder.ts', 'const x = 1;', {
      language: 'typescript',
      startLine: 1,
      endLine: 10,
    });

    expect(fileXml).toContain('<file_context path="src/builder.ts" language="typescript" lines="L1-L10">');
    expect(fileXml).toContain('```typescript');
    expect(fileXml).toContain('const x = 1;');
    expect(fileXml).toContain('</file_context>');
  });

  it('formats system instructions with structured rules', () => {
    const sysXml = formatSystemInstructions(
      ['Perform accurate code edits', 'Respond concisely'],
      ['No hallucinated imports', 'Never delete unit tests']
    );

    expect(sysXml).toContain('<instructions>');
    expect(sysXml).toContain('- Perform accurate code edits');
    expect(sysXml).toContain('<rules>');
    expect(sysXml).toContain('* No hallucinated imports');
  });

  it('truncates message history to token budget while preserving system prompt', () => {
    const builder = new PromptBuilder();
    builder.system('You are a helpful coding assistant.');
    for (let i = 0; i < 20; i++) {
      builder.user(`User question ${i}: ${'x'.repeat(100)}`);
      builder.assistant(`Assistant answer ${i}: ${'y'.repeat(100)}`);
    }

    const initialTokens = builder.estimateTokens();
    expect(initialTokens).toBeGreaterThan(1000);

    builder.truncateToBudget(200);

    const truncatedTokens = builder.estimateTokens();
    expect(truncatedTokens).toBeLessThanOrEqual(200);

    const messages = builder.buildMessages();
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toBe('You are a helpful coding assistant.');
  });
});
