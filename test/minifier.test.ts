import { describe, it, expect } from 'vitest';
import { minifyPrompt, analyzeTokenSavings } from '../src/index.js';

describe('Prompt Minifier & Token Savings', () => {
  it('strips HTML/XML and C-style comments while retaining content', () => {
    const raw = `
    <!-- System instructions for AI agent -->
    You are an AI assistant.
    /* Internal developer note: Keep answers short */
    // Do not include sensitive data
    Please summarize the code.
    `;

    const minified = minifyPrompt(raw);
    expect(minified).not.toContain('System instructions');
    expect(minified).not.toContain('Internal developer note');
    expect(minified).not.toContain('Do not include sensitive data');
    expect(minified).toContain('You are an AI assistant.');
    expect(minified).toContain('Please summarize the code.');
  });

  it('preserves code blocks without altering code internal whitespace', () => {
    const raw = `
    Help me with this function:

    \`\`\`typescript
    function test() {
      // Keep this comment inside code
      return 42;
    }
    \`\`\`

    <!-- Strip this comment -->
    `;

    const minified = minifyPrompt(raw);
    expect(minified).toContain('// Keep this comment inside code');
    expect(minified).not.toContain('Strip this comment');
  });

  it('calculates token savings stats accurately', () => {
    const original = 'A '.repeat(500); // 1000 chars, ~250 tokens
    const minified = 'A '.repeat(100); // 200 chars, ~50 tokens

    const stats = analyzeTokenSavings(original, minified);
    expect(stats.originalLength).toBe(1000);
    expect(stats.minifiedLength).toBe(200);
    expect(stats.tokensSaved).toBeGreaterThan(150);
    expect(stats.percentReduced).toBe(80);
  });
});
