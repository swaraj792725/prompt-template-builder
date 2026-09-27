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
});
