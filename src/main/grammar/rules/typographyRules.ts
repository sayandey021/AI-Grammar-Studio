import { RulePattern } from './types';

export const TYPOGRAPHY_RULES: RulePattern[] = [
  // Multiple spaces
  { regex: / {2,}/g, exp: "Multiple spaces detected.", rep: " ", type: 'punctuation' },
  
  // Space before punctuation
  { regex: /\s+([.,!?:;])/g, exp: "Remove extra space before punctuation.", rep: "$1", type: 'punctuation' },
  
  // Missing space after punctuation (ignoring numbers like 3.14)
  { regex: /([.,!?:;])([A-Za-z])/g, exp: "Add a space after punctuation.", rep: "$1 $2", type: 'punctuation' },

  // Ellipsis (three dots instead of real ellipsis character or more than 3 dots)
  { regex: /\.{4,}/g, exp: "Use three dots for an ellipsis.", rep: "...", type: 'punctuation' },

  // Comma splice (heuristic: two full sentences joined by a comma, but we'll stick to basic formatting here for now)
  // E.g. "word ,word" -> "word, word" (Handled by the two rules above)

  // Em dash (space hyphen space -> em dash)
  { regex: /\s+--\s+/g, exp: "Consider using an em dash (—) or en dash (–) without spaces.", rep: "—", type: 'punctuation' }
];
