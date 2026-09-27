import { MinifyOptions, TokenSavingsResult } from './types.js';

/**
 * Minifies prompt strings to optimize token consumption for LLM prompts.
 * Intelligently preserves markdown code blocks while stripping comments,
 * trailing whitespace, and redundant blank lines.
 */
export function minifyPrompt(prompt: string, options: MinifyOptions = {}): string {
  const {
    stripComments = true,
    collapseBlankLines = true,
    trimTrailingWhitespace = true,
    preserveCodeBlocks = true,
  } = options;

  if (!prompt) return prompt;

  if (preserveCodeBlocks) {
    // Regex matches markdown code blocks ``` ... ```
    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const parts = prompt.split(codeBlockRegex);

    return parts
      .map((part) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          return part; // Return code block untouched
        }
        return processPromptText(part, {
          stripComments,
          collapseBlankLines,
          trimTrailingWhitespace,
        });
      })
      .join('');
  }

  return processPromptText(prompt, {
    stripComments,
    collapseBlankLines,
    trimTrailingWhitespace,
  });
}

function processPromptText(
  text: string,
  opts: {
    stripComments: boolean;
    collapseBlankLines: boolean;
    trimTrailingWhitespace: boolean;
  }
): string {
  let processed = text;

  if (opts.stripComments) {
    // Strip HTML/XML comments <!-- comment -->
    processed = processed.replace(/<!--[\s\S]*?-->/g, '');
    // Strip C-style multi-line comments /* comment */
    processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
    // Strip single-line comments starting with // (avoiding http:// or https://)
    processed = processed.replace(/(^|[^:\n])\/\/.*$/gm, '$1');
  }

  if (opts.trimTrailingWhitespace) {
    processed = processed
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
  }

  if (opts.collapseBlankLines) {
    // Collapse 3 or more newlines down to 2 (single blank line between blocks)
    processed = processed.replace(/\n{3,}/g, '\n\n');
  }

  return processed.trim();
}

/**
 * Estimates rough token count based on character heuristic (~4 chars per token).
 */
export function countEstimatedTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Calculates character and estimated token savings achieved through prompt minification.
 */
export function analyzeTokenSavings(original: string, minified: string): TokenSavingsResult {
  const originalLength = original.length;
  const minifiedLength = minified.length;

  const originalTokens = countEstimatedTokens(original);
  const minifiedTokens = countEstimatedTokens(minified);

  const tokensSaved = Math.max(0, originalTokens - minifiedTokens);
  const percentReduced =
    originalTokens > 0
      ? Number((((originalTokens - minifiedTokens) / originalTokens) * 100).toFixed(2))
      : 0;

  return {
    originalLength,
    minifiedLength,
    originalTokens,
    minifiedTokens,
    tokensSaved,
    percentReduced: Math.max(0, percentReduced),
  };
}

/** Alias for analyzeTokenSavings */
export const calculateTokenSavings = analyzeTokenSavings;
