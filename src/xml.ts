import { XmlElementOptions } from './types.js';

/**
 * Escapes special XML characters (&, <, >, ", ') to prevent structural prompt injection.
 */
export function escapeXmlContent(input: string): string {
  if (typeof input !== 'string') return String(input);
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Constructs an XML element string wrapped in start and end tags.
 * Recommended by Anthropic and OpenAI for structured prompt context (e.g. <documents>, <instructions>).
 */
export function xmlTag(tagName: string, content: string, options: XmlElementOptions = {}): string {
  const { attributes = {}, indent = 0 } = options;
  const padding = ' '.repeat(indent);
  
  const attrString = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeXmlContent(value)}"`)
    .join('');

  const trimmedContent = content.trim();

  if (indent > 0 && trimmedContent.includes('\n')) {
    const indentedContent = trimmedContent
      .split('\n')
      .map(line => `${padding}  ${line}`)
      .join('\n');
    return `${padding}<${tagName}${attrString}>\n${indentedContent}\n${padding}</${tagName}>`;
  }

  return `${padding}<${tagName}${attrString}>${trimmedContent}</${tagName}>`;
}
