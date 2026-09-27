import { VariableMap, PromptTemplateOptions } from './types.js';
import { escapeXmlContent } from './xml.js';

export function getVariableRegex(style: PromptTemplateOptions['delimiterStyle'] = 'double-brace'): RegExp {
  switch (style) {
    case 'dollar-brace':
      return /\$\{([a-zA-Z0-9_\-]+)\}/g;
    case 'square-bracket':
      return /\[([a-zA-Z0-9_\-]+)\]/g;
    case 'double-brace':
    default:
      return /\{\{([a-zA-Z0-9_\-]+)\}\}/g;
  }
}

export function interpolateTemplate(
  template: string,
  variables: VariableMap,
  options: PromptTemplateOptions = {}
): string {
  const regex = getVariableRegex(options.delimiterStyle);
  const { stripUnhandledVariables = false, escapeXml = false } = options;

  return template.replace(regex, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(variables, varName)) {
      const val = variables[varName];
      let formatted: string;

      if (val === null || val === undefined) {
        formatted = '';
      } else if (Array.isArray(val) || typeof val === 'object') {
        formatted = JSON.stringify(val, null, 2);
      } else {
        formatted = String(val);
      }

      return escapeXml ? escapeXmlContent(formatted) : formatted;
    }

    return stripUnhandledVariables ? '' : match;
  });
}
