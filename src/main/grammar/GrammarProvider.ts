export interface Suggestion {
  id: string;
  start: number;
  end: number;
  issue: string;
  explanation: string;
  replacements: string[];
  type?: 'spelling' | 'grammar' | 'punctuation' | 'style' | 'capitalization';
}

export interface ReadabilityMetrics {
  score: number; // 0 - 100
  label: string; // e.g. "Professional", "Conversational", "Complex"
  readingTimeSeconds: number;
  wordCount: number;
  sentenceCount: number;
  hardSentencesCount: number;
}

export interface GrammarResult {
  text: string;
  suggestions: Suggestion[];
  rewritePreview?: string; // AI mode can offer a full rewrite
  readability?: ReadabilityMetrics;
}

export interface GrammarProvider {
  check(text: string, options?: any): Promise<GrammarResult>;
}
