export interface RulePattern {
  id?: string;
  regex: RegExp;
  exp: string; // Explanation
  rep: string; // Replacement string
  type?: 'grammar' | 'style' | 'punctuation' | 'capitalization' | 'spelling';
}
