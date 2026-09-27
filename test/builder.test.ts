import { describe, test, expect } from 'vitest';
import { createPromptBuilder, xmlTag, interpolateTemplate } from '../src/index.js';

describe('PromptBuilder', () => {
  test('creates system and user messages with variable interpolation', () => {
    const builder = createPromptBuilder();
    builder
      .system('You are an expert {{role}} assistant.', { role: 'TypeScript' })
      .user('Help me fix {{topic}} in my code.', { topic: 'generics' });

    const messages = builder.buildMessages();
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toBe('You are an expert TypeScript assistant.');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Help me fix generics in my code.');
  });

  test('formats XML tags correctly', () => {
    const xml = xmlTag('context', 'Some dynamic context', { attributes: { id: 'doc-1' } });
    expect(xml).toBe('<context id="doc-1">Some dynamic context</context>');
  });

  test('escapes XML content to prevent injection when enabled', () => {
    const interpolated = interpolateTemplate(
      'Search query: {{query}}',
      { query: '<script>alert("xss")</script>' },
      { escapeXml: true }
    );
    expect(interpolated).toBe('Search query: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  test('estimates tokens accurately', () => {
    const builder = createPromptBuilder();
    builder.user('Hello world!'); // 12 chars -> ~3 tokens
    expect(builder.estimateTokens()).toBe(3);
  });

  test('adds file context blocks to builder', () => {
    const builder = createPromptBuilder();
    builder.addFileContext('src/index.ts', 'export const x = 1;', { language: 'typescript' });
    
    const messages = builder.buildMessages();
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('<file_context path="src/index.ts" language="typescript">');
  });

  test('minifies messages in builder to reduce tokens', () => {
    const builder = createPromptBuilder();
    builder.user('Line 1\n\n\n\n\nLine 2 // remove comment\n');
    builder.minify({ stripComments: true, collapseBlankLines: true });

    const messages = builder.buildMessages();
    expect(messages[0].content).not.toContain('// remove comment');
    expect(messages[0].content).toBe('Line 1\n\nLine 2');
  });

  test('truncates message history based on token limit', () => {
    const builder = createPromptBuilder();
    builder
      .system('System instruction')
      .user('Message 1: '.padEnd(100, 'a'))
      .assistant('Response 1: '.padEnd(100, 'b'))
      .user('Message 2: '.padEnd(100, 'c'));

    builder.truncateToBudget(40);

    const messages = builder.buildMessages();
    expect(messages[0].role).toBe('system');
    expect(builder.estimateTokens()).toBeLessThanOrEqual(40);
  });

  test('provides token savings statistics', () => {
    const builder = createPromptBuilder();
    builder.user('<!-- comment --> Hello world <!-- comment 2 -->');
    builder.minify();

    const stats = builder.getTokenStats();
    expect(stats.tokensSaved).toBeGreaterThan(0);
    expect(stats.percentReduced).toBeGreaterThan(0);
  });
});
