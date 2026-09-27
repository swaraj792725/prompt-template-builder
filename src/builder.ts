import {
  MessageRole,
  PromptMessage,
  VariableMap,
  PromptTemplateOptions,
  MinifyOptions,
  TokenSavingsResult,
  FileContextOptions,
  TruncateOptions,
} from './types.js';
import { interpolateTemplate } from './sanitizer.js';
import { xmlTag } from './xml.js';
import { minifyPrompt, calculateTokenSavings, countEstimatedTokens } from './minifier.js';
import { formatFileContext } from './context.js';

export class PromptBuilder {
  private messages: PromptMessage[] = [];
  private options: PromptTemplateOptions;
  private rawTextBeforeMinification?: string;

  constructor(options: PromptTemplateOptions = {}) {
    this.options = options;
  }

  /**
   * Adds a system message to the prompt sequence
   */
  system(content: string, variables?: VariableMap): this {
    return this.addMessage('system', content, variables);
  }

  /**
   * Adds a developer message (OpenAI o1/o3 support)
   */
  developer(content: string, variables?: VariableMap): this {
    return this.addMessage('developer', content, variables);
  }

  /**
   * Adds a user message
   */
  user(content: string, variables?: VariableMap): this {
    return this.addMessage('user', content, variables);
  }

  /**
   * Adds an assistant message (for few-shot learning or message history)
   */
  assistant(content: string, variables?: VariableMap): this {
    return this.addMessage('assistant', content, variables);
  }

  /**
   * Generic message adder
   */
  addMessage(role: MessageRole, content: string, variables?: VariableMap): this {
    const rendered = variables
      ? interpolateTemplate(content, variables, this.options)
      : content;

    this.messages.push({ role, content: rendered });
    return this;
  }

  /**
   * Appends an XML tagged section to the last message or as a new user message
   */
  xmlSection(tagName: string, content: string, attributes?: Record<string, string>): this {
    const formattedXml = xmlTag(tagName, content, { attributes });
    if (this.messages.length > 0) {
      const lastMsg = this.messages[this.messages.length - 1];
      lastMsg.content += `\n\n${formattedXml}`;
    } else {
      this.user(formattedXml);
    }
    return this;
  }

  /**
   * Appends a structured file context tag to the prompt sequence
   */
  addFileContext(filePath: string, content: string, options?: FileContextOptions): this {
    const fileXml = formatFileContext(filePath, content, options);
    return this.user(fileXml);
  }

  /**
   * Minifies all messages in the prompt sequence to save AI token bandwidth
   */
  minify(options?: MinifyOptions): this {
    if (!this.rawTextBeforeMinification) {
      this.rawTextBeforeMinification = this.buildText();
    }
    this.messages = this.messages.map((msg) => ({
      ...msg,
      content: minifyPrompt(msg.content, options),
    }));
    return this;
  }

  /**
   * Truncates message history to respect a maximum token budget
   */
  truncateToTokenLimit(maxTokens: number, options: TruncateOptions = {}): this {
    const { preserveSystemMessages = true, strategy = 'start' } = options;

    let currentTokens = this.estimateTokens();
    if (currentTokens <= maxTokens) return this;

    const preserved: PromptMessage[] = [];
    let reducible: PromptMessage[] = [];

    for (const msg of this.messages) {
      if (preserveSystemMessages && (msg.role === 'system' || msg.role === 'developer')) {
        preserved.push(msg);
      } else {
        reducible.push(msg);
      }
    }

    while (reducible.length > 0) {
      const candidateList = [...preserved, ...reducible];
      const totalChars = candidateList.reduce((acc, m) => acc + m.content.length, 0);
      if (Math.ceil(totalChars / 4) <= maxTokens) break;

      if (strategy === 'start') {
        reducible.shift();
      } else {
        reducible.pop();
      }
    }

    this.messages = strategy === 'start'
      ? [...preserved, ...reducible]
      : [...preserved, ...reducible];

    return this;
  }

  /**
   * Alias for truncateToTokenLimit
   */
  truncateToBudget(maxTokens: number, options?: TruncateOptions): this {
    return this.truncateToTokenLimit(maxTokens, options);
  }

  /**
   * Estimates rough token count based on character heuristic (~4 chars per token)
   */
  estimateTokens(): number {
    const totalChars = this.messages.reduce((acc, msg) => acc + msg.content.length, 0);
    return countEstimatedTokens(this.messages.map((m) => m.content).join(''));
  }

  /**
   * Provides detailed token statistics for all messages in the builder
   */
  getTokenStats(): TokenSavingsResult {
    const currentText = this.buildText();
    const rawText = this.rawTextBeforeMinification || currentText;
    return calculateTokenSavings(rawText, currentText);
  }

  /**
   * Returns array of messages formatted for LLM SDKs (OpenAI, Anthropic, Vercel AI SDK)
   */
  buildMessages(): PromptMessage[] {
    return [...this.messages];
  }

  /**
   * Builds single combined prompt string (suitable for completion models)
   */
  buildText(separator: string = '\n\n'): string {
    return this.messages.map((msg) => `[${msg.role.toUpperCase()}]:\n${msg.content}`).join(separator);
  }

  /**
   * Resets internal message state
   */
  clear(): this {
    this.messages = [];
    this.rawTextBeforeMinification = undefined;
    return this;
  }
}

/**
 * Quick helper function to create a new PromptBuilder instance
 */
export function createPromptBuilder(options?: PromptTemplateOptions): PromptBuilder {
  return new PromptBuilder(options);
}
