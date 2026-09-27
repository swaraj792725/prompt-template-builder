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
