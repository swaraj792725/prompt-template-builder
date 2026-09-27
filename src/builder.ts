import { MessageRole, PromptMessage, VariableMap, PromptTemplateOptions } from './types.js';
import { interpolateTemplate } from './sanitizer.js';
import { xmlTag } from './xml.js';

export class PromptBuilder {
  private messages: PromptMessage[] = [];
  private options: PromptTemplateOptions;

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
   * Estimates rough token count based on character heuristic (~4 chars per token)
   */
  estimateTokens(): number {
    const totalChars = this.messages.reduce((acc, msg) => acc + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
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
    return this.messages.map(msg => `[${msg.role.toUpperCase()}]:\n${msg.content}`).join(separator);
  }

  /**
   * Resets internal message state
   */
  clear(): this {
    this.messages = [];
    return this;
  }
}

/**
 * Quick helper function to create a new PromptBuilder instance
 */
export function createPromptBuilder(options?: PromptTemplateOptions): PromptBuilder {
  return new PromptBuilder(options);
}
