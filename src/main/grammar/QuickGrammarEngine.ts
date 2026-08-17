import { GrammarProvider, GrammarResult, Suggestion } from './GrammarProvider';
import writeGood from 'write-good';
import nlp from 'compromise';

// Import modular rules
import { 
  CONTRACTIONS, 
  SLANG_MAP, 
  PROPER_NOUNS, 
  KNOWN_ACRONYMS, 
  QUESTION_STARTERS, 
  VOWEL_EXCEPTIONS_A, 
  CONSONANT_EXCEPTIONS_AN, 
  CUSTOM_DICTIONARY_WORDS,
  CUSTOM_DICTIONARY_SET 
} from './rules/dictionary';
import { GRAMMAR_RULES } from './rules/grammarRules';
import { STYLE_RULES } from './rules/styleRules';
import { TYPOGRAPHY_RULES } from './rules/typographyRules';
import { transformVoice } from './rules/voiceEngine';
import { transformNarration } from './rules/narrationEngine';
import { transformDegree } from './rules/degreeEngine';

const ALL_RULES = [...GRAMMAR_RULES, ...STYLE_RULES, ...TYPOGRAPHY_RULES];

export function applySuggestionsToText(text: string, suggestions: Suggestion[]): string {
  if (!suggestions || suggestions.length === 0) return text;
  
  const valid = suggestions.filter(s => 
    s.replacements && 
    s.replacements.length > 0 && 
    s.replacements[0] !== undefined && 
    s.replacements[0] !== null
  );

  if (valid.length === 0) return text;

  // Sort by start position ascending, then span length descending (longer, more specific rules take precedence)
  valid.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  // Filter out overlapping suggestions to prevent text corruption
  const nonOverlapping: Suggestion[] = [];
  let lastEnd = -1;

  for (const s of valid) {
    if (s.start >= lastEnd) {
      nonOverlapping.push(s);
      lastEnd = s.end;
    }
  }

  // Sort descending by start position to apply replacements right-to-left
  nonOverlapping.sort((a, b) => b.start - a.start);

  let result = text;
  for (const s of nonOverlapping) {
    if (s.start >= 0 && s.end <= result.length && s.start < s.end) {
      const rep = s.replacements[0];
      result = result.substring(0, s.start) + rep + result.substring(s.end);
    }
  }
  return result;
}

function detectTenseAndVoice(verbPhrase: string, fallbackForm: string): { form: string, voice: 'Active' | 'Passive' } {
  const phrase = verbPhrase.toLowerCase().trim();
  let form = fallbackForm;
  let voice: 'Active' | 'Passive' = 'Active';

  const hasBe = /\b(is|am|are|was|were|be|been|being)\b/.test(phrase);
  const hasHave = /\b(has|have|had)\b/.test(phrase);
  const hasWill = /\b(will|shall)\b/.test(phrase);

  if (hasBe && (!phrase.endsWith('ing') || phrase.includes('being'))) {
     voice = 'Passive';
  }

  if (hasWill) {
    if (phrase.includes('have been') && phrase.endsWith('ing')) form = 'future-perfect-progressive';
    else if (phrase.includes('have been')) form = 'future-perfect';
    else if (phrase.includes('have')) form = 'future-perfect';
    else if (phrase.includes('be') && phrase.endsWith('ing')) form = 'future-progressive';
    else form = 'simple-future';
  } else if (hasHave && phrase.includes('had')) {
    if (phrase.includes('been') && phrase.endsWith('ing')) form = 'past-perfect-progressive';
    else form = 'past-perfect';
  } else if (hasHave) {
    if (phrase.includes('been') && phrase.endsWith('ing')) form = 'present-perfect-progressive';
    else form = 'present-perfect';
  } else if (hasBe && /\b(was|were)\b/.test(phrase)) {
    if (phrase.endsWith('ing') && !phrase.includes('being')) form = 'past-progressive';
    else if (phrase.includes('being')) form = 'past-progressive';
    else form = 'simple-past';
  } else if (hasBe) {
    if (phrase.endsWith('ing') && !phrase.includes('being')) form = 'present-progressive';
    else if (phrase.includes('being')) form = 'present-progressive';
    else form = 'simple-present';
  } else {
    if (/\b(did)\b/.test(phrase) || fallbackForm.includes('past')) form = 'simple-past';
    else form = 'simple-present';
  }

  return { form, voice };
}

function splitIntoUnitsRespectingQuotes(text: string): string[] {
  const units: string[] = [];
  let current = '';
  let inDouble = false;
  let inSingle = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;

    if (char === '"') inDouble = !inDouble;
    // Basic heuristic to avoid apostrophes acting as single quotes
    if (char === "'" && (i === 0 || text[i-1] === ' ' || !/[a-zA-Z]/.test(text[i-1]))) {
      inSingle = !inSingle;
    } else if (char === "'" && inSingle && (i === text.length - 1 || text[i+1] === ' ' || !/[a-zA-Z]/.test(text[i+1]))) {
      inSingle = !inSingle;
    }

    if (!inDouble && !inSingle && (char === '.' || char === '?' || char === '!')) {
      const nextChar = text[i + 1];
      if (!nextChar || nextChar === ' ' || nextChar === '\n') {
        units.push(current.trim());
        current = '';
        while (text[i + 1] === ' ' || text[i + 1] === '\n') i++;
      }
    }
  }

  if (current.trim()) units.push(current.trim());
  return units;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function calculateReadability(text: string) {
  const words = text.trim().match(/\b[A-Za-z0-9'-]+\b/g) || [];
  const wordCount = words.length;
  if (wordCount === 0) {
    return {
      score: 100, label: 'N/A', readingTimeSeconds: 0,
      wordCount: 0, sentenceCount: 0, hardSentencesCount: 0
    };
  }

  const sentences = text.split(/[.?!]+\s+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  let totalSyllables = 0;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }

  const score = Math.round(
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount)
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  let label = 'Professional';
  if (clampedScore >= 80) label = 'Very Easy & Accessible';
  else if (clampedScore >= 60) label = 'Clear & Professional';
  else if (clampedScore >= 40) label = 'Advanced / Technical';
  else label = 'Complex / Dense';

  let hardSentencesCount = 0;
  for (const s of sentences) {
    const sWords = s.trim().match(/\b[A-Za-z0-9'-]+\b/g) || [];
    if (sWords.length > 25) hardSentencesCount++;
  }

  const readingTimeSeconds = Math.max(1, Math.round((wordCount / 200) * 60));

  return {
    score: clampedScore, label, readingTimeSeconds,
    wordCount, sentenceCount, hardSentencesCount
  };
}

function getTerminalPunctuation(sentenceText: string): { mark: string; explanation: string } {
  const trimmed = sentenceText.trim();
  const firstWordMatch = /^[A-Za-z']+/g.exec(trimmed);
  if (firstWordMatch) {
    const firstWordLower = firstWordMatch[0].toLowerCase();
    if (QUESTION_STARTERS.has(firstWordLower)) {
      return { mark: '?', explanation: 'Questions should end with a question mark (?).' };
    }
  }
  return { mark: '.', explanation: 'Sentences should end with terminal punctuation (e.g. a period).' };
}

function getContraction(original: string): string | null {
  const lower = original.toLowerCase();
  if (!CONTRACTIONS[lower]) return null;
  const rep = CONTRACTIONS[lower];
  if (rep.startsWith("I'")) return rep; 
  if (original[0] === original[0].toUpperCase()) return rep.charAt(0).toUpperCase() + rep.slice(1);
  return rep;
}

export class QuickGrammarEngine implements GrammarProvider {
  private spellchecker: any = null;
  private initializing: Promise<void> | null = null;
  private storage: any;
  private spellCache: Map<string, string[]> = new Map();

  constructor(storage?: any) {
    this.storage = storage;
    this.initSpellchecker();
  }

  public addCustomWord(word: string) {
    if (this.spellchecker) {
      try { this.spellchecker.add(word); } catch (e) { }
    }
  }

  public removeCustomWord(word: string) {
    if (this.spellchecker) {
      try { this.spellchecker.remove(word); } catch (e) { }
    }
  }

  private initSpellchecker() {
    if (!this.initializing) {
      this.initializing = (async () => {
        try {
          const dynamicImport = new Function('specifier', 'return import(specifier)');
          const nspellModule = await dynamicImport('nspell');
          const dictionaryEnModule = await dynamicImport('dictionary-en');
          
          const nspell = (nspellModule as any).default || nspellModule;
          const dictionaryEn = (dictionaryEnModule as any).default || dictionaryEnModule;

          this.spellchecker = nspell(dictionaryEn.aff as any, dictionaryEn.dic as any);

          CUSTOM_DICTIONARY_WORDS.forEach(word => {
            try { this.spellchecker.add(word); } catch (e) { }
          });

          if (this.storage) {
            const settings = this.storage.getSettings();
            if (settings && settings.customDictionary) {
              settings.customDictionary.forEach((word: string) => {
                try { this.spellchecker.add(word); } catch (e) { }
              });
            }
          }
          console.log('Offline spellchecker loaded with expanded custom dictionary.');
        } catch (error) {
          console.error('Failed to load spellchecker:', error);
        }
      })();
    }
    return this.initializing;
  }

  async check(text: string): Promise<GrammarResult> {
    await this.initSpellchecker();

    const suggestions: Suggestion[] = [];
    
    const addSuggestion = (s: Suggestion) => {
      if (!s.issue) return;
      const existing = suggestions.find(e => e.start === s.start && e.end === s.end);
      if (existing) {
        if (s.replacements && s.replacements.length > 0) {
          const combined = [...(existing.replacements || []), ...s.replacements].filter(Boolean);
          existing.replacements = Array.from(new Set(combined));
        }
      } else {
        suggestions.push(s);
      }
    };

    // 1. Style & Grammar Checks using write-good
    const wgSuggestions = writeGood(text);
    for (const wg of wgSuggestions) {
      addSuggestion({
        id: `wg-${Date.now()}-${wg.index}`,
        start: wg.index,
        end: wg.index + wg.offset,
        issue: text.substring(wg.index, wg.index + wg.offset),
        explanation: wg.reason,
        replacements: [],
        type: 'style'
      });
    }

    // 2. Process all modular rules (Grammar, Style, Typography)
    for (const rule of ALL_RULES) {
      rule.regex.lastIndex = 0;
      const cleanRegex = (rule as any)._cleanRegex || ((rule as any)._cleanRegex = new RegExp(rule.regex.source, 'i'));
      let m;
      while ((m = rule.regex.exec(text)) !== null) {
        const replacementStr = m[0].replace(cleanRegex, rule.rep);
        
        let issue = m[0];
        let start = m.index;
        let end = m.index + m[0].length;
        
        // Homophone logic: if rule has capture groups and no $ in replacement, 
        // highlight only the captured word
        if (m.length > 1 && !rule.rep.includes('$')) {
          for (let i = 1; i < m.length; i++) {
             if (m[i]) {
                const isExactMatch = m[0] === m[i]; 
                if (!isExactMatch) {
                    issue = m[i];
                    start = m.index + m[0].indexOf(m[i]);
                    end = start + issue.length;
                    break;
                }
             }
          }
        }

        let finalReplacement = replacementStr;
        if (issue !== m[0]) {
           // We are only highlighting a specific word, so replace only that word
           const isCapitalized = issue[0] === issue[0].toUpperCase();
           finalReplacement = isCapitalized ? rule.rep.charAt(0).toUpperCase() + rule.rep.slice(1) : rule.rep;
        }

        addSuggestion({
          id: `${rule.type}-${Date.now()}-${start}`,
          start,
          end,
          issue,
          explanation: rule.exp,
          replacements: [finalReplacement],
          type: rule.type || 'grammar'
        });
      }
    }
    // 2.5 Passive Voice General Detection
    const PASSIVE_VOICE_GENERAL_REGEX = /\b(am|is|are|was|were|been|being|be)\s+([a-z]+ed|[a-z]+en)\s+(by)\b/gi;
    let match;
    while ((match = PASSIVE_VOICE_GENERAL_REGEX.exec(text)) !== null) {
      addSuggestion({
        id: `passive-general-${Date.now()}-${match.index}`,
        start: match.index,
        end: match.index + match[0].length,
        issue: match[0],
        explanation: `Passive voice detected ("${match[0]}"). Consider rephrasing in active voice for a stronger professional tone.`,
        replacements: [],
        type: 'style'
      });
    }

    // 2.6 Active Voice Conversion Helper
    const voiceAnalysis = transformVoice(text);
    if (voiceAnalysis.originalVoice === 'Passive Voice' && voiceAnalysis.convertedText) {
      addSuggestion({
        id: `voice-active-${Date.now()}-0`,
        start: 0,
        end: text.length,
        issue: text,
        explanation: `Passive voice detected. Active voice alternative: "${voiceAnalysis.convertedText}".`,
        replacements: [voiceAnalysis.convertedText],
        type: 'style'
      });
    }

    // 2.7 Direct Speech & Narration Punctuation Rules
    const DIRECT_SPEECH_REGEX = /\b(said|asked|told|stated|replied|declared|announced|remarked)\s*,?\s*"([a-z])/g;
    while ((match = DIRECT_SPEECH_REGEX.exec(text)) !== null) {
      const charIndex = match.index + match[0].length - 1;
      const quoteChar = match[2];
      addSuggestion({
        id: `narration-cap-${Date.now()}-${charIndex}`,
        start: charIndex,
        end: charIndex + 1,
        issue: quoteChar,
        explanation: "Direct speech quotes should begin with a capital letter.",
        replacements: [quoteChar.toUpperCase()],
        type: 'punctuation'
      });
    }

    // 3. "a" vs "an" Indefinite Articles Rule
    const aArticleRegex = /\b(a)\s+([a-zA-Z]+)\b/gi;
    while ((match = aArticleRegex.exec(text)) !== null) {
      const article = match[1];
      const nextWord = match[2];
      const nextLower = nextWord.toLowerCase();
      const startsWithVowel = /^[aeiou]/i.test(nextWord);

      if (startsWithVowel && !VOWEL_EXCEPTIONS_A.has(nextLower)) {
        const repArticle = article[0] === article[0].toUpperCase() ? 'An' : 'an';
        addSuggestion({
          id: `article-${Date.now()}-${match.index}`, start: match.index, end: match.index + article.length,
          issue: article, explanation: `Use 'an' before words starting with a vowel sound.`, replacements: [repArticle], type: 'grammar'
        });
      } else if (!startsWithVowel && CONSONANT_EXCEPTIONS_AN.has(nextLower)) {
        const repArticle = article[0] === article[0].toUpperCase() ? 'An' : 'an';
        addSuggestion({
          id: `article-${Date.now()}-${match.index}`, start: match.index, end: match.index + article.length,
          issue: article, explanation: `Use 'an' before words starting with a silent 'h'.`, replacements: [repArticle], type: 'grammar'
        });
      }
    }

    const anArticleRegex = /\b(an)\s+([a-zA-Z]+)\b/gi;
    while ((match = anArticleRegex.exec(text)) !== null) {
      const article = match[1];
      const nextWord = match[2];
      const nextLower = nextWord.toLowerCase();
      const startsWithVowel = /^[aeiou]/i.test(nextWord);

      if (!startsWithVowel && !CONSONANT_EXCEPTIONS_AN.has(nextLower)) {
        const repArticle = article[0] === article[0].toUpperCase() ? 'A' : 'a';
        addSuggestion({
          id: `article-${Date.now()}-${match.index}`, start: match.index, end: match.index + article.length,
          issue: article, explanation: `Use 'a' before words starting with a consonant sound.`, replacements: [repArticle], type: 'grammar'
        });
      } else if (startsWithVowel && VOWEL_EXCEPTIONS_A.has(nextLower)) {
        const repArticle = article[0] === article[0].toUpperCase() ? 'A' : 'a';
        addSuggestion({
          id: `article-${Date.now()}-${match.index}`, start: match.index, end: match.index + article.length,
          issue: article, explanation: `Use 'a' before words starting with a consonant 'u'/'eu' sound.`, replacements: [repArticle], type: 'grammar'
        });
      }
    }

    // 4. Compromise NLP Analysis for Places, People, and Organizations (Capitalization)
    try {
      const doc = nlp(text);
      const entities = [
        ...doc.people().out('array'),
        ...doc.places().out('array'),
        ...doc.organizations().out('array')
      ];

      for (const entity of entities) {
        if (!entity || entity.length < 2) continue;
        const lowerEntity = entity.toLowerCase();
        const lowerText = text.toLowerCase();
        let entityIdx = lowerText.indexOf(lowerEntity);
        while (entityIdx !== -1) {
          const rawText = text.substring(entityIdx, entityIdx + entity.length);
          const expectedCapitalized = rawText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          if (rawText !== expectedCapitalized && rawText[0] === rawText[0].toLowerCase()) {
            addSuggestion({
              id: `nlp-proper-${Date.now()}-${entityIdx}`, start: entityIdx, end: entityIdx + rawText.length,
              issue: rawText, explanation: `Proper nouns, places, and organization names should start with a capital letter.`, replacements: [expectedCapitalized], type: 'capitalization'
            });
          }
          entityIdx = lowerText.indexOf(lowerEntity, entityIdx + entity.length);
        }
      }
    } catch (e) {
      console.warn('Compromise NLP extraction warning:', e);
    }

    // 5. Word-level checks: ALL-CAPS, Slang, Proper Nouns, Contractions, and Spellchecking
    const wordRegex = /\b[A-Za-z']+\b/g;
    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const lower = word.toLowerCase();
      const index = match.index;

      if (word === word.toUpperCase() && word.length > 1 && !word.includes("'")) {
        if (!KNOWN_ACRONYMS.has(word)) {
          const formatted = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          addSuggestion({
            id: `caps-${Date.now()}-${index}`, start: index, end: index + word.length,
            issue: word, explanation: `Words in ALL CAPS should have only the first letter capitalized.`, replacements: [formatted], type: 'capitalization'
          });
          continue;
        }
      }

      if (SLANG_MAP[lower]) {
        const rep = SLANG_MAP[lower];
        const formatted = word[0] === word[0].toUpperCase() ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep;
        addSuggestion({
          id: `slang-${Date.now()}-${index}`, start: index, end: index + word.length,
          issue: word, explanation: `Informal slang. Consider using '${formatted}'.`, replacements: [formatted], type: 'style'
        });
        continue;
      }

      if (PROPER_NOUNS[lower] && word !== PROPER_NOUNS[lower]) {
        addSuggestion({
          id: `proper-${Date.now()}-${index}`, start: index, end: index + word.length,
          issue: word, explanation: `Nouns and proper nouns should start with a capital letter.`, replacements: [PROPER_NOUNS[lower]], type: 'capitalization'
        });
        continue;
      }

      const contraction = getContraction(word);
      if (contraction) {
        addSuggestion({
          id: `contr-${Date.now()}-${index}`, start: index, end: index + word.length,
          issue: word, explanation: `Consider using an apostrophe.`, replacements: [contraction], type: 'grammar'
        });
      } else if (this.spellchecker && word.length > 1 && !word.includes("'") && !KNOWN_ACRONYMS.has(word) && !KNOWN_ACRONYMS.has(lower) && !CUSTOM_DICTIONARY_SET.has(lower)) {
        if (!this.spellchecker.correct(word)) {
          let suggestions = this.spellCache.get(lower);
          if (!suggestions) {
            suggestions = this.spellchecker.suggest(word);
            if (this.spellCache.size > 1000) this.spellCache.clear(); // Basic LRU-like reset
            this.spellCache.set(lower, suggestions || []);
          }
          const topSug = suggestions && suggestions.length > 0 ? suggestions[0] : null;

          if (word[0] === word[0].toLowerCase() && topSug && topSug === word.charAt(0).toUpperCase() + word.slice(1)) {
            addSuggestion({
              id: `proper-spell-${Date.now()}-${index}`, start: index, end: index + word.length,
              issue: word, explanation: `Nouns and proper nouns should start with a capital letter.`, replacements: [topSug], type: 'capitalization'
            });
          } else if (topSug && word.toLowerCase() === topSug.replace(/['\-]/g, '').toLowerCase()) {
            addSuggestion({
              id: `punct-spell-${Date.now()}-${index}`, start: index, end: index + word.length,
              issue: word, explanation: `Missing punctuation (apostrophe or hyphen).`, replacements: [topSug], type: 'punctuation'
            });
          } else if (suggestions && suggestions.length > 0) {
            addSuggestion({
              id: `spell-${Date.now()}-${index}`, start: index, end: index + word.length,
              issue: word, explanation: `Possible spelling mistake.`, replacements: suggestions.slice(0, 3), type: 'spelling'
            });
          }
        }
      }
    }

    // 6. Sentence Capitalization
    const sentenceStartRegex = /(^|[.?!]\s+)([a-z])/g;
    while ((match = sentenceStartRegex.exec(text)) !== null) {
      const charIndex = match.index + match[1].length;
      addSuggestion({
        id: `cap-${Date.now()}-${charIndex}`, start: charIndex, end: charIndex + 1,
        issue: match[2], explanation: "Sentences should start with a capital letter.", replacements: [match[2].toUpperCase()], type: 'capitalization'
      });
    }

    // 7. Standalone 'i'
    const iRegex = /\b(i)\b/g;
    while ((match = iRegex.exec(text)) !== null) {
      addSuggestion({
        id: `i-${Date.now()}-${match.index}`, start: match.index, end: match.index + 1,
        issue: "i", explanation: "The pronoun 'I' should be capitalized.", replacements: ["I"], type: 'capitalization'
      });
    }

    // 8. Missing terminal punctuation at the end of text
    const trimmed = text.trimEnd();
    if (trimmed.length > 0) {
      const lastChar = trimmed[trimmed.length - 1];
      if (!['.', '?', '!'].includes(lastChar)) {
        const lastWordMatch = /\b[A-Za-z0-9']+\b$/g.exec(trimmed);
        if (lastWordMatch) {
          const lastWord = lastWordMatch[0];
          const lastWordIndex = lastWordMatch.index;

          const lastSentenceStart = Math.max(
            trimmed.lastIndexOf('.'), trimmed.lastIndexOf('?'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('\n')
          );
          const lastSentence = trimmed.substring(lastSentenceStart + 1).trim();
          const { mark, explanation } = getTerminalPunctuation(lastSentence);

          addSuggestion({
            id: `punct-end-${Date.now()}-${lastWordIndex}`, start: lastWordIndex, end: lastWordIndex + lastWord.length,
            issue: lastWord, explanation, replacements: [`${lastWord}${mark}`], type: 'punctuation'
          });
        }
      }
    }

    // 9. Missing period between sentences (e.g., "word Word")
    const missingSentencePeriodRegex = /\b([a-z0-9]+)\s+([A-Z][a-z]+)\b/g;
    while ((match = missingSentencePeriodRegex.exec(text)) !== null) {
      const firstWordLower = match[1].toLowerCase();
      if (!['mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr'].includes(firstWordLower)) {
        const word1 = match[1];
        const word2 = match[2];
        const matchIndex = match.index;

        const prevText = text.substring(0, matchIndex + word1.length);
        const lastSentenceStart = Math.max(
          prevText.lastIndexOf('.'), prevText.lastIndexOf('?'), prevText.lastIndexOf('!'), prevText.lastIndexOf('\n')
        );
        const currentSentence = prevText.substring(lastSentenceStart + 1).trim();
        const { mark } = getTerminalPunctuation(currentSentence);

        addSuggestion({
          id: `punct-sentence-${Date.now()}-${matchIndex}`, start: matchIndex, end: matchIndex + match[0].length,
          issue: match[0], explanation: "Consider adding terminal punctuation to separate sentences.", replacements: [`${word1}${mark} ${word2}`], type: 'punctuation'
        });
      }
    }

    suggestions.sort((a, b) => a.start - b.start);
    const rewrite = applySuggestionsToText(text, suggestions);
    return { 
      text, 
      suggestions, 
      readability: calculateReadability(text),
      rewritePreview: suggestions.length > 0 ? rewrite : `✨ Perfect! Your sentence "${text}" is already grammatically correct.`
    };
  }

  async analyze(text: string, action: string): Promise<any> {
    const doc = nlp(text);
    if (action === 'pos') {
      const data = doc.json().flatMap((sentence: any) => 
        sentence.terms.map((t: any) => {
          let category = 'Unknown';
          let explanation = 'Could not precisely categorize this word.';
          const tags = t.tags || [];
          
          if (tags.includes('Verb')) {
            if (tags.includes('Auxiliary')) { category = 'Auxiliary Verb'; explanation = 'Helps the main verb express tense, mood, or voice (e.g., is, have, will).'; }
            else if (tags.includes('Modal')) { category = 'Modal Verb'; explanation = 'Expresses necessity, possibility, or permission (e.g., can, could, must, should).'; }
            else if (tags.includes('Gerund')) { category = 'Gerund'; explanation = 'A verb ending in "-ing" that functions as a noun.'; }
            else if (tags.includes('Infinitive')) { category = 'Infinitive'; explanation = 'The base form of a verb, often preceded by "to".'; }
            else if (tags.includes('PastParticiple')) { category = 'Past Participle'; explanation = 'The form of a verb used in perfect tenses or passive voice.'; }
            else { category = 'Action Verb'; explanation = 'Expresses a physical or mental action or state of being.'; }
          } else if (tags.includes('Noun')) {
            if (tags.includes('Pronoun')) {
              if (tags.includes('Person')) { category = 'Personal Pronoun'; explanation = 'Replaces a specific person or thing (e.g., I, you, he, she, it).'; }
              else if (tags.includes('Demonstrative')) { category = 'Demonstrative Pronoun'; explanation = 'Points to specific things (e.g., this, that, these, those).'; }
              else { category = 'Pronoun'; explanation = 'A word that takes the place of a noun.'; }
            } else if (tags.includes('ProperNoun')) {
              category = 'Proper Noun'; explanation = 'A specific, capitalized name for a particular person, place, or thing.';
            } else if (tags.includes('Plural')) {
              category = 'Plural Noun'; explanation = 'Refers to more than one person, place, thing, or idea.';
            } else {
              category = 'Noun'; explanation = 'A word that names a person, place, thing, or idea.';
            }
          } else if (tags.includes('Adjective')) {
            if (tags.includes('Comparative')) { category = 'Comparative Adjective'; explanation = 'Compares two things (e.g., taller, faster).'; }
            else if (tags.includes('Superlative')) { category = 'Superlative Adjective'; explanation = 'Indicates the highest degree of a quality (e.g., tallest, fastest).'; }
            else { category = 'Adjective'; explanation = 'Modifies or describes a noun or pronoun.'; }
          } else if (tags.includes('Adverb')) {
            category = 'Adverb'; explanation = 'Modifies a verb, adjective, or another adverb, often telling how, when, where, or to what extent.';
          } else if (tags.includes('Preposition')) {
            category = 'Preposition'; explanation = 'Shows the relationship of a noun or pronoun to another word (e.g., in, on, at, by).';
          } else if (tags.includes('Conjunction')) {
            category = 'Conjunction'; explanation = 'Connects words, phrases, or clauses (e.g., and, but, or, because).';
          } else if (tags.includes('Determiner')) {
            category = 'Determiner (Article)'; explanation = 'Introduces a noun and identifies it as specific or unspecific (e.g., a, an, the, some).';
          } else if (tags.includes('Value')) {
            category = 'Number / Value'; explanation = 'Represents a numerical value or quantity.';
          } else if (tags.includes('QuestionWord')) {
            category = 'Question Word'; explanation = 'Used to ask a question (e.g., who, what, where, when, why, how).';
          } else if (tags.includes('Expression')) {
            category = 'Interjection / Expression'; explanation = 'A word or phrase that expresses strong emotion or sudden feeling.';
          }

          return { text: t.text, tags: t.tags, category, explanation };
        })
      );
      return { type: 'pos', data };
    } else if (action === 'degree') {
      return transformDegree(text);
    } else if (action === 'tense') {
      const TENSE_MAP: Record<string, any> = {
        'simple-present': {
          name: 'Simple Present Tense',
          definition: 'Used for habits, routines, general truths, scheduled events, and permanent states.',
          positiveStructure: 'Subject + Verb (base / V1 or -s / -es) + Object',
          negativeStructure: 'Subject + do / does + not + Verb (base / V1) + Object',
          interrogativeStructure: 'Do / Does + Subject + Verb (base / V1) + Object?',
          interrogativeNegativeStructure: 'Do / Does + Subject + not + Verb (base / V1) + Object?',
          passive: {
            name: 'Simple Present Tense (Passive)',
            positiveStructure: 'Object + is / am / are + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + is / am / are + not + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Is / Am / Are + Object + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Is / Am / Are + Object + not + Verb (past participle / V3) + by Subject?'
          }
        },
        'present-progressive': {
          name: 'Present Continuous Tense',
          definition: 'Used for actions happening right now at the time of speaking or temporary situations.',
          positiveStructure: 'Subject + is / am / are + Verb(-ing) + Object',
          negativeStructure: 'Subject + is / am / are + not + Verb(-ing) + Object',
          interrogativeStructure: 'Is / Am / Are + Subject + Verb(-ing) + Object?',
          interrogativeNegativeStructure: 'Is / Am / Are + Subject + not + Verb(-ing) + Object?',
          passive: {
            name: 'Present Continuous Tense (Passive)',
            positiveStructure: 'Object + is / am / are + being + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + is / am / are + not + being + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Is / Am / Are + Object + being + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Is / Am / Are + Object + not + being + Verb (past participle / V3) + by Subject?'
          }
        },
        'present-perfect': {
          name: 'Present Perfect Tense',
          definition: 'Used for actions completed in the past that have a direct result or relevance to the present.',
          positiveStructure: 'Subject + has / have + Verb (past participle / V3) + Object',
          negativeStructure: 'Subject + has / have + not + Verb (past participle / V3) + Object',
          interrogativeStructure: 'Has / Have + Subject + Verb (past participle / V3) + Object?',
          interrogativeNegativeStructure: 'Has / Have + Subject + not + Verb (past participle / V3) + Object?',
          passive: {
            name: 'Present Perfect Tense (Passive)',
            positiveStructure: 'Object + has / have + been + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + has / have + not + been + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Has / Have + Object + been + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Has / Have + Object + not + been + Verb (past participle / V3) + by Subject?'
          }
        },
        'present-perfect-progressive': {
          name: 'Present Perfect Continuous Tense',
          definition: 'Used for actions that started in the past and are still continuing continuously into the present.',
          positiveStructure: 'Subject + has / have + been + Verb(-ing) + Object',
          negativeStructure: 'Subject + has / have + not + been + Verb(-ing) + Object',
          interrogativeStructure: 'Has / Have + Subject + been + Verb(-ing) + Object?',
          interrogativeNegativeStructure: 'Has / Have + Subject + not + been + Verb(-ing) + Object?'
        },
        'simple-past': {
          name: 'Simple Past Tense',
          definition: 'Used for completed actions that occurred at a specific point in the past.',
          positiveStructure: 'Subject + Verb (past / V2) + Object',
          negativeStructure: 'Subject + did + not + Verb (base / V1) + Object',
          interrogativeStructure: 'Did + Subject + Verb (base / V1) + Object?',
          interrogativeNegativeStructure: 'Did + Subject + not + Verb (base / V1) + Object?',
          passive: {
            name: 'Simple Past Tense (Passive)',
            positiveStructure: 'Object + was / were + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + was / were + not + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Was / Were + Object + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Was / Were + Object + not + Verb (past participle / V3) + by Subject?'
          }
        },
        'past-progressive': {
          name: 'Past Continuous Tense',
          definition: 'Used for an action that was ongoing at a specific moment in the past.',
          positiveStructure: 'Subject + was / were + Verb(-ing) + Object',
          negativeStructure: 'Subject + was / were + not + Verb(-ing) + Object',
          interrogativeStructure: 'Was / Were + Subject + Verb(-ing) + Object?',
          interrogativeNegativeStructure: 'Was / Were + Subject + not + Verb(-ing) + Object?',
          passive: {
            name: 'Past Continuous Tense (Passive)',
            positiveStructure: 'Object + was / were + being + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + was / were + not + being + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Was / Were + Object + being + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Was / Were + Object + not + being + Verb (past participle / V3) + by Subject?'
          }
        },
        'past-perfect': {
          name: 'Past Perfect Tense',
          definition: 'Used for an action completed before another past event or specific time in the past.',
          positiveStructure: 'Subject + had + Verb (past participle / V3) + Object',
          negativeStructure: 'Subject + had + not + Verb (past participle / V3) + Object',
          interrogativeStructure: 'Had + Subject + Verb (past participle / V3) + Object?',
          interrogativeNegativeStructure: 'Had + Subject + not + Verb (past participle / V3) + Object?',
          passive: {
            name: 'Past Perfect Tense (Passive)',
            positiveStructure: 'Object + had + been + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + had + not + been + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Had + Object + been + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Had + Object + not + been + Verb (past participle / V3) + by Subject?'
          }
        },
        'past-perfect-progressive': {
          name: 'Past Perfect Continuous Tense',
          definition: 'Used for an ongoing past action that took place before another past event.',
          positiveStructure: 'Subject + had + been + Verb(-ing) + Object',
          negativeStructure: 'Subject + had + not + been + Verb(-ing) + Object',
          interrogativeStructure: 'Had + Subject + been + Verb(-ing) + Object?',
          interrogativeNegativeStructure: 'Had + Subject + not + been + Verb(-ing) + Object?'
        },
        'simple-future': {
          name: 'Simple Future Tense',
          definition: 'Used for future actions, promises, predictions, or instant decisions.',
          positiveStructure: 'Subject + will / shall + Verb (base / V1) + Object',
          negativeStructure: 'Subject + will / shall + not + Verb (base / V1) + Object',
          interrogativeStructure: 'Will / Shall + Subject + Verb (base / V1) + Object?',
          interrogativeNegativeStructure: 'Will / Shall + Subject + not + Verb (base / V1) + Object?',
          passive: {
            name: 'Simple Future Tense (Passive)',
            positiveStructure: 'Object + will / shall + be + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + will / shall + not + be + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Will / Shall + Object + be + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Will / Shall + Object + not + be + Verb (past participle / V3) + by Subject?'
          }
        },
        'future-progressive': {
          name: 'Future Continuous Tense',
          definition: 'Used for an action that will be in progress at a specific moment in the future.',
          positiveStructure: 'Subject + will + be + Verb(-ing) + Object',
          negativeStructure: 'Subject + will + not + be + Verb(-ing) + Object',
          interrogativeStructure: 'Will + Subject + be + Verb(-ing) + Object?',
          interrogativeNegativeStructure: 'Will + Subject + not + be + Verb(-ing) + Object?'
        },
        'future-perfect': {
          name: 'Future Perfect Tense',
          definition: 'Used for an action that will be completed before a certain point in the future.',
          positiveStructure: 'Subject + will + have + Verb (past participle / V3) + Object',
          negativeStructure: 'Subject + will + not + have + Verb (past participle / V3) + Object',
          interrogativeStructure: 'Will + Subject + have + Verb (past participle / V3) + Object?',
          interrogativeNegativeStructure: 'Will + Subject + not + have + Verb (past participle / V3) + Object?',
          passive: {
            name: 'Future Perfect Tense (Passive)',
            positiveStructure: 'Object + will + have + been + Verb (past participle / V3) + by Subject',
            negativeStructure: 'Object + will + not + have + been + Verb (past participle / V3) + by Subject',
            interrogativeStructure: 'Will + Object + have + been + Verb (past participle / V3) + by Subject?',
            interrogativeNegativeStructure: 'Will + Object + not + have + been + Verb (past participle / V3) + by Subject?'
          }
        },
        'future-perfect-progressive': {
          name: 'Future Perfect Continuous Tense',
          definition: 'Used for ongoing actions that will continue up until a specific point in the future.',
          positiveStructure: 'Subject + will + have + been + Verb(-ing) + Object',
          negativeStructure: 'Subject + will + not + have + been + Verb(-ing) + Object',
          interrogativeStructure: 'Will + Subject + have + been + Verb(-ing) + Object?',
          interrogativeNegativeStructure: 'Will + Subject + not + have + been + Verb(-ing) + Object?'
        }
      };

      let sentenceType = 'Positive (Affirmative)';
      const isQuestion = doc.sentences().isQuestion().found || text.trim().endsWith('?');
      const isNegative = doc.has('#Negative') || /\b(not|n't|never|no|nobody|nothing)\b/i.test(text);

      if (isQuestion && isNegative) sentenceType = 'Interrogative Negative (Question + Negative)';
      else if (isQuestion) sentenceType = 'Interrogative (Question)';
      else if (isNegative) sentenceType = 'Negative';
      else if (doc.has('#Imperative')) sentenceType = 'Imperative (Command/Request)';
      else if (text.trim().endsWith('!')) sentenceType = 'Exclamatory (Exclamation)';

      const tenses: any[] = [];
      const sentencesData = doc.sentences().json();
      
      sentencesData.forEach((s: any) => {
        const sentenceText = s.text.trim();
        const sentenceDoc = nlp(sentenceText);
        const verbsData = sentenceDoc.verbs().json();
        
        verbsData.forEach((v: any) => {
          const baseForm = v.verb?.grammar?.form || '';
          
          const { form, voice } = detectTenseAndVoice(v.text, baseForm);
          const baseTenseInfo = TENSE_MAP[form] || TENSE_MAP['simple-present'];
          
          let tenseInfo = baseTenseInfo;
          if (voice === 'Passive' && baseTenseInfo.passive) {
            tenseInfo = baseTenseInfo.passive;
            tenseInfo.definition = baseTenseInfo.definition; // keep original definition
          } else if (voice === 'Passive') {
            tenseInfo = { ...baseTenseInfo, name: baseTenseInfo.name + ' (Passive)' };
          }
          
          tenses.push({
            sentenceText,
            verbPhrase: v.text, infinitive: v.verb?.infinitive || v.text, form, voice,
            name: tenseInfo.name, definition: tenseInfo.definition,
            positiveStructure: tenseInfo.positiveStructure, negativeStructure: tenseInfo.negativeStructure,
            interrogativeStructure: tenseInfo.interrogativeStructure, interrogativeNegativeStructure: tenseInfo.interrogativeNegativeStructure,
          });
        });
      });

      return { type: 'tense', sentenceType, data: tenses };
    } else if (action === 'clause') {
      const sentences = doc.sentences().json();
      const clauseAnalysis = sentences.map((sentenceObj: any) => {
        const sentenceText = sentenceObj.text.trim();
        const sentenceDoc = nlp(sentenceText);
        
        const coordinatingConjunctions = ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'];
        const subordinatingConjunctions = [
          'because', 'although', 'even though', 'though', 'since', 'if', 'unless',
          'when', 'whenever', 'while', 'after', 'before', 'as', 'until', 'whereas',
          'wherever', 'so that', 'provided that', 'assuming that'
        ];
        const relativePronouns = ['who', 'whom', 'whose', 'which', 'that'];
        const nounClauseStarters = ['what', 'whatever', 'whoever', 'whichever', 'why', 'how', 'whether'];

        const clauses: any[] = [];
        const rawParts = sentenceText.split(/(?=\b(?:and|but|or|nor|for|yet|so|because|although|even though|though|since|if|unless|when|whenever|while|after|before|as|until|whereas|wherever|who|whom|whose|which|that|what|why|how)\b)/i);
        
        let independentCount = 0;
        let dependentCount = 0;

        rawParts.forEach((part: string, index: number) => {
          const trimmedPart = part.replace(/^[,\s]+/, '').trim();
          if (!trimmedPart) return;

          const partDoc = nlp(trimmedPart);
          const words = trimmedPart.split(/\s+/);
          const firstWord = words[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';

          let connector: string | null = null;
          let clauseType = 'Independent Clause (Main Clause)';
          let role = 'Expresses a complete thought and can stand alone as a sentence.';

          if (coordinatingConjunctions.includes(firstWord)) {
            connector = firstWord;
            if (index > 0) {
              clauseType = 'Independent Clause (Coordinated)';
              role = 'Connects equal independent thoughts using a coordinating conjunction.';
              independentCount++;
            } else {
              independentCount++;
            }
          } else if (subordinatingConjunctions.includes(firstWord)) {
            connector = firstWord;
            clauseType = 'Dependent Clause (Adverbial / Subordinate)';
            role = 'Modifies the main verb or clause by expressing reason, condition, time, or contrast.';
            dependentCount++;
          } else if (relativePronouns.includes(firstWord)) {
            connector = firstWord;
            clauseType = 'Dependent Clause (Relative / Adjective)';
            role = 'Provides descriptive information about a noun in the main clause.';
            dependentCount++;
          } else if (nounClauseStarters.includes(firstWord)) {
            connector = firstWord;
            clauseType = 'Dependent Clause (Noun Clause)';
            role = 'Functions as a noun (subject or object) within the sentence structure.';
            dependentCount++;
          } else {
            independentCount++;
          }

          const verbObj = partDoc.verbs().first();
          const verbPhrase = verbObj.text() || 'N/A';
          
          let subject = 'Implied / Contextual';
          let predicate = 'N/A';

          const nounsBeforeVerb = partDoc.nouns().before(verbPhrase).first().text();
          if (nounsBeforeVerb) subject = nounsBeforeVerb;
          else if (partDoc.pronouns().before(verbPhrase).first().text()) subject = partDoc.pronouns().before(verbPhrase).first().text();
          else if ((partDoc as any).subjects && (partDoc as any).subjects().first().text()) subject = (partDoc as any).subjects().first().text();

          const rest = partDoc.after(verbPhrase).text();
          if (rest) predicate = rest;

          clauses.push({ text: trimmedPart, type: clauseType, connector, subject, verbPhrase, predicate, role });
        });

        let sentenceClassification = 'Simple Sentence';
        if (independentCount >= 2 && dependentCount >= 1) sentenceClassification = 'Compound-Complex Sentence';
        else if (independentCount >= 2) sentenceClassification = 'Compound Sentence';
        else if (dependentCount >= 1) sentenceClassification = 'Complex Sentence';

        return { sentenceText, classification: sentenceClassification, clauseCount: clauses.length, independentCount, dependentCount, clauses };
      });

      return { type: 'clause', data: clauseAnalysis };
    } else if (action === 'voice') {
      const units = splitIntoUnitsRespectingQuotes(text);
      if (units.length > 1) {
        const results = units.map(u => transformVoice(u));
        const combinedText = results.map((r, i) => r.convertedText || units[i]).join(' ');
        const allExceptions = Array.from(new Set(results.flatMap(r => r.exceptionsApplied || [])));
        return {
          type: 'voice',
          convertedText: combinedText,
          originalVoice: 'Mixed / Paragraph',
          convertedVoice: 'Mixed / Paragraph',
          explanation: 'Processed multiple sentences sequentially.',
          exceptionsApplied: allExceptions,
          isAiEnhanced: false
        };
      }
      return transformVoice(text);
    } else if (action === 'narration') {
      const units = splitIntoUnitsRespectingQuotes(text);
      if (units.length > 1) {
        const results = units.map(u => transformNarration(u));
        const combinedText = results.map((r, i) => r.convertedText || units[i]).join(' ');
        const allExceptions = Array.from(new Set(results.flatMap(r => r.exceptionsApplied || [])));
        return {
          type: 'narration',
          convertedText: combinedText,
          exceptionsApplied: allExceptions
        };
      }
      return transformNarration(text);
    }
    return { type: 'error', data: 'Unknown action' };
  }
}
