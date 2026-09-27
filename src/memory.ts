import { xmlTag } from './xml.js';

export interface CodebaseFile {
  path: string;
  content: string;
  language?: string;
}

export interface CodebaseContextOptions {
  /** Maximum lines per file before truncating (default: unlimited) */
  maxLinesPerFile?: number;
  /** Wrap code in Markdown codeblocks inside XML tags (default: true) */
  wrapCodeblock?: boolean;
  /** Root XML tag name wrapping the full codebase context (default: 'codebase_context') */
  rootTag?: string;
}

/**
 * Converts code files into structured XML context tags optimized for LLM system prompts.
 * Follows Anthropic / OpenAI best practices for RAG and agent context injection.
 */
export function createCodebaseContext(
  files: CodebaseFile[],
  options: CodebaseContextOptions = {}
): string {
  const {
    maxLinesPerFile,
    wrapCodeblock = true,
    rootTag = 'codebase_context'
  } = options;

  const fileSnippets = files.map(file => {
    let content = file.content;

    if (maxLinesPerFile && maxLinesPerFile > 0) {
      const lines = content.split('\n');
      if (lines.length > maxLinesPerFile) {
        content = lines.slice(0, maxLinesPerFile).join('\n') + `\n... [Truncated ${lines.length - maxLinesPerFile} lines]`;
      }
    }

    const formattedContent = wrapCodeblock
      ? `\`\`\`${file.language || ''}\n${content}\n\`\`\``
      : content;

    return xmlTag('file', formattedContent, {
      attributes: { path: file.path }
    });
  });

  const innerContent = fileSnippets.join('\n\n');
  return xmlTag(rootTag, innerContent);
}

/**
 * Creates structured key-value memory context in XML for AI agent state tracking.
 */
export function createStructuredMemory(
  data: Record<string, unknown>,
  options: { rootTag?: string } = {}
): string {
  const rootTag = options.rootTag || 'agent_memory';
  const entries = Object.entries(data).map(([key, val]) => {
    const valString = typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : String(val);
    return xmlTag(key, valString);
  });

  return xmlTag(rootTag, entries.join('\n'));
}
