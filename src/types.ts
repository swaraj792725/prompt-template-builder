export type MessageRole = 'system' | 'user' | 'assistant' | 'developer';

export interface PromptMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

export type VariableValue = string | number | boolean | null | undefined | string[] | object;

export type VariableMap = Record<string, VariableValue>;

export interface PromptTemplateOptions {
  /** Delimiter style for variables. Default is 'double-brace' (e.g. {{variable}}) */
  delimiterStyle?: 'double-brace' | 'dollar-brace' | 'square-bracket';
  /** Strips unhandled variables instead of preserving them or throwing */
  stripUnhandledVariables?: boolean;
  /** Automatically escapes XML characters inside variable injections */
  escapeXml?: boolean;
}

export interface XmlElementOptions {
  attributes?: Record<string, string>;
  indent?: number;
}

export interface MinifyOptions {
  /** Strip developer comments (e.g. // comment or HTML comments) */
  stripComments?: boolean;
  /** Collapse 3+ consecutive newlines into 2 */
  collapseBlankLines?: boolean;
  /** Trim trailing spaces on lines */
  trimTrailingWhitespace?: boolean;
  /** Preserve markdown code fences without altering whitespace inside them */
  preserveCodeBlocks?: boolean;
}

export interface TokenSavingsResult {
  originalLength: number;
  minifiedLength: number;
  originalTokens: number;
  minifiedTokens: number;
  tokensSaved: number;
  percentReduced: number;
}

export interface FileContextOptions {
  language?: string;
  startLine?: number;
  endLine?: number;
  attributes?: Record<string, string>;
}

export interface TruncateOptions {
  /** Keep system and developer messages untouched. Default: true */
  preserveSystemMessages?: boolean;
  /** Position to truncate from ('start' removes oldest history, 'end' cuts off tail). Default: 'start' */
  strategy?: 'start' | 'end';
}
