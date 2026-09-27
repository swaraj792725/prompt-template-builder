import { FileContextOptions } from './types.js';
import { escapeXmlContent } from './xml.js';

export interface FormatFileContextOptions extends FileContextOptions {
  lines?: string;
  tagName?: string;
  wrapCodeblock?: boolean;
}

/**
 * Formats a single file context into structural XML tags.
 */
export function formatFileContext(
  filePath: string,
  content: string,
  options: FormatFileContextOptions = {}
): string {
  const {
    language = 'text',
    startLine,
    endLine,
    lines: linesOpt,
    tagName: customTag = 'file_context',
    wrapCodeblock = true
  } = options;

  let linesAttr = linesOpt;
  if (!linesAttr && (startLine !== undefined || endLine !== undefined)) {
    const start = startLine ?? 1;
    const end = endLine ?? 'end';
    linesAttr = `L${start}-L${end}`;
  }

  const linesTag = linesAttr ? ` lines="${linesAttr}"` : '';
  const langTag = ` language="${escapeXmlContent(language)}"`;
  const pathTag = ` path="${escapeXmlContent(filePath)}"`;

  const body = wrapCodeblock
    ? `\`\`\`${language}\n${content.trim()}\n\`\`\``
    : content.trim();

  return `<${customTag}${pathTag}${langTag}${linesTag}>\n${body}\n</${customTag}>`;
}

/** Alias for formatFileContext */
export const buildFileContext = formatFileContext;

/**
 * Formats a snippet context block into XML.
 */
export function formatSnippetContext(
  label: string,
  content: string,
  options: { language?: string } = {}
): string {
  const { language = 'text' } = options;
  const labelTag = ` label="${escapeXmlContent(label)}"`;
  const codeFence = `\`\`\`${language}\n${content.trim()}\n\`\`\``;

  return `<snippet${labelTag}>\n${codeFence}\n</snippet>`;
}

/**
 * Formats system instructions and rules into structured XML blocks.
 */
export function formatSystemInstructions(
  instructions: string[],
  rules: string[] = [],
  options: { roleTitle?: string } = {}
): string {
  const { roleTitle = 'AI Assistant' } = options;

  const header = `You are ${roleTitle}. Follow all instructions and guidelines strictly.`;
  const instList = instructions.map(inst => `- ${inst}`).join('\n');
  const instXml = `<instructions>\n${instList}\n</instructions>`;

  const parts = [header, instXml];

  if (rules.length > 0) {
    const ruleList = rules.map(r => `* ${r}`).join('\n');
    parts.push(`<rules>\n${ruleList}\n</rules>`);
  }

  return parts.join('\n\n');
}

/**
 * Compiles a list of repository files into a unified codebase memory block.
 */
export function buildContextMemory(
  files: Array<{ path: string; content: string; options?: FormatFileContextOptions }>
): string {
  if (!files || files.length === 0) return '<codebase_context />';

  const fileBlocks = files.map(file => formatFileContext(file.path, file.content, file.options));
  return `<codebase_context>\n${fileBlocks.join('\n\n')}\n</codebase_context>`;
}
