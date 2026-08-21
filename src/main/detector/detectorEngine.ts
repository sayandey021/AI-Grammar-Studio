import https from 'https';
import { URL } from 'url';

export interface SentenceAnalysis {
  id: number;
  text: string;
  start: number;
  end: number;
  wordCount: number;
  perplexity: number;
  burstiness: number;
  aiScore: number; // 0 - 100
  category: 'human' | 'mixed' | 'likely_ai' | 'heavy_ai';
  explanation: string;
  isPlagiarized?: boolean;
  plagiarismMatch?: {
    source: string;
    url?: string;
    similarity: number;
    snippet?: string;
  };
}

export interface WebSourceMatch {
  title: string;
  url: string;
  snippet: string;
  matchPercentage: number;
  matchedText: string;
}

export interface DetectorResult {
  overallAiScore: number; // 0 - 100
  overallOriginalityScore: number; // 0 - 100
  overallPlagiarismScore: number; // 0 - 100
  classification: 'Highly Likely Human' | 'Likely Human' | 'Mixed Content' | 'Likely AI-Generated' | 'Heavy AI-Generated';
  isOnlineMode: boolean;
  neuralModelUsed?: string;
  metrics: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    burstinessScore: number;
    perplexityScore: number;
    lexicalDiversity: number; // TTR
    readingGradeLevel: number;
    readingTimeMinutes: number;
  };
  sentences: SentenceAnalysis[];
  webSources: WebSourceMatch[];
  internalDuplicates: {
    sentenceIndexA: number;
    sentenceIndexB: number;
    similarity: number;
  }[];
  generatedAt: string;
}

// Common AI transition & cliché phrases
const AI_MARKER_PATTERNS = [
  /\b(delve|delving)\s+into\b/i,
  /\b(rich\s+tapestry|tapestry\s+of)\b/i,
  /\b(testament\s+to|stands\s+as\s+a\s+testament)\b/i,
  /\b(beacon\s+of|fosters\s+a\s+sense\s+of)\b/i,
  /\b(in\s+today's\s+(fast-paced|digital|interconnected)\s+world)\b/i,
  /\b(it\s+is\s+(important|crucial|essential)\s+to\s+(note|remember|recognize|highlight)\s+that)\b/i,
  /\b(furthermore|moreover|consequently|nonetheless),\s+it\s+is\s+worth\b/i,
  /\b(in\s+conclusion,\s+(it\s+is\s+evident|we\s+can\s+see))\b/i,
  /\b(serves\s+as\s+a\s+reminder\s+that)\b/i,
  /\b(plays\s+a\s+(crucial|vital|pivotal|fundamental)\s+role\s+in)\b/i,
  /\b(navigating\s+the\s+complexities\s+of)\b/i,
  /\b(a\s+plethora\s+of|a\s+myriad\s+of)\b/i,
  /\b(unlock(ing)?\s+the\s+potential\s+of)\b/i,
  /\b(ever-evolving\s+landscape\s+of)\b/i,
  /\b(sheds\s+light\s+on\s+the\s+importance)\b/i,
];

// Common English word frequencies (approximate Zipfian distribution weights)
const COMMON_STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also'
]);

/**
 * Splits text into individual sentences with precise character offsets
 */
export function splitSentencesWithOffsets(text: string): { text: string; start: number; end: number }[] {
  const sentences: { text: string; start: number; end: number }[] = [];
  if (!text.trim()) return sentences;

  const regex = /([^.!?\n]+[.!?]+(?:['"”’\)]|\s|$)|[^\n]+(?:\n+|$))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const leadingSpaces = raw.indexOf(trimmed);
      const start = match.index + leadingSpaces;
      const end = start + trimmed.length;
      sentences.push({
        text: trimmed,
        start,
        end,
      });
    }
  }

  if (sentences.length === 0 && text.trim().length > 0) {
    const trimmed = text.trim();
    const start = text.indexOf(trimmed);
    sentences.push({
      text: trimmed,
      start,
      end: start + trimmed.length,
    });
  }

  return sentences;
}

/**
 * Tokenizes text into lowercase words without punctuation
 */
function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
}

/**
 * Creates N-Gram shingles from an array of words
 */
function createShingles(words: string[], n: number = 4): string[] {
  const shingles: string[] = [];
  if (words.length < n) {
    if (words.length > 0) shingles.push(words.join(' '));
    return shingles;
  }
  for (let i = 0; i <= words.length - n; i++) {
    shingles.push(words.slice(i, i + n).join(' '));
  }
  return shingles;
}

/**
 * Calculates Jaccard Similarity between two sets of shingles
 */
function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculates Containment (percentage of setA found in setB)
 */
function calculateContainment(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / setA.size;
}

/**
 * Computes sentence-level Perplexity/Surprisal estimation
 */
function computeSentencePerplexity(words: string[]): number {
  if (words.length === 0) return 0;
  let totalEntropy = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const isStop = COMMON_STOPWORDS.has(word);
    const wordLen = word.length;
    const wordSurprisal = isStop ? 1.5 : Math.min(8.5, 2.8 + wordLen * 0.45);
    totalEntropy += wordSurprisal;
  }

  return totalEntropy / words.length;
}

/**
 * Calculates Flesch-Kincaid Reading Grade Level
 */
function calculateReadingGrade(totalWords: number, totalSentences: number, totalSyllables: number): number {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const grade = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
  return Math.max(1, Math.min(18, Math.round(grade * 10) / 10));
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// In-memory lightweight LRU cache for web search queries (Max 100 entries, ~50KB RAM footprint)
const searchCache = new Map<string, Array<{ title: string; url: string; snippet: string }>>();

/**
 * Searches DuckDuckGo for matching web snippets with 3.5s timeout
 */
async function queryDuckDuckGo(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  return new Promise((resolve) => {
    try {
      const sanitizedQuery = encodeURIComponent(query.slice(0, 150));
      const targetUrl = `https://html.duckduckgo.com/html/?q="${sanitizedQuery}"`;
      const parsedUrl = new URL(targetUrl);

      const req = https.get({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 3500,
      }, (res) => {
        let body = '';
        res.on('data', chunk => { 
          body += chunk;
          if (body.length > 500000) req.destroy(); // Cap response body at 500KB to save memory
        });
        res.on('end', () => {
          const results: Array<{ title: string; url: string; snippet: string }> = [];
          try {
            const resultBlocks = body.split(/class="result__body"/g).slice(1, 4);
            for (const block of resultBlocks) {
              const urlMatch = block.match(/class="result__url"[^>]*href="([^"]+)"/i) || block.match(/href="([^"]+)"/i);
              const titleMatch = block.match(/class="result__title"[^>]*>([\s\S]*?)<\/h2>/i);
              const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

              if (snippetMatch) {
                const rawSnippet = snippetMatch[1].replace(/<[^>]+>/g, '').trim();
                const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Web Source';
                let rawUrl = urlMatch ? urlMatch[1] : '';
                if (rawUrl.includes('uddg=')) {
                  const decoded = decodeURIComponent(rawUrl.split('uddg=')[1].split('&')[0]);
                  rawUrl = decoded;
                }

                if (rawSnippet.length > 20) {
                  results.push({
                    title: rawTitle,
                    url: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
                    snippet: rawSnippet,
                  });
                }
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
          resolve(results);
        });
      });

      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Searches Wikipedia Open API as a lightweight academic / encyclopedic fallback
 */
async function queryWikipedia(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  return new Promise((resolve) => {
    try {
      const sanitizedQuery = encodeURIComponent(query.slice(0, 120));
      const targetUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${sanitizedQuery}&utf8=&format=json&srlimit=2`;
      const parsedUrl = new URL(targetUrl);

      const req = https.get({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'AIGrammarStudio/1.1 (Desktop Plagiarism Checker; contact@aigrammar.studio)',
          'Accept': 'application/json',
        },
        timeout: 3000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          const results: Array<{ title: string; url: string; snippet: string }> = [];
          try {
            const data = JSON.parse(body);
            if (data.query && Array.isArray(data.query.search)) {
              for (const item of data.query.search) {
                const cleanSnippet = (item.snippet || '').replace(/<[^>]+>/g, '').trim();
                if (cleanSnippet.length > 20) {
                  results.push({
                    title: `Wikipedia: ${item.title}`,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
                    snippet: cleanSnippet,
                  });
                }
              }
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
          resolve(results);
        });
      });

      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Performs a cached, multi-strategy web search query for online plagiarism detection
 */
async function searchWebForSnippet(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const cacheKey = query.toLowerCase().trim();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // Try DuckDuckGo first
  let results = await queryDuckDuckGo(query);

  // If no results returned or rate-limited, query Wikipedia fallback
  if (results.length === 0) {
    results = await queryWikipedia(query);
  }

  // Manage in-memory cache size (keep under 100 items)
  if (searchCache.size >= 100) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(cacheKey, results);

  return results;
}

/**
 * Main function: Analyzes text for AI Probability, Plagiarism (Offline/Online), and Quality Metrics
 */
export async function analyzePlagiarismAndAI(
  text: string,
  options: {
    onlineMode?: boolean;
    referenceText?: string;
    neuralScores?: number[];
    neuralModelName?: string;
  } = {}
): Promise<DetectorResult> {
  const { onlineMode = false, referenceText = '', neuralScores, neuralModelName } = options;

  const rawSentences = splitSentencesWithOffsets(text);
  const totalWords = tokenizeWords(text);
  const totalWordCount = totalWords.length;
  const totalSentenceCount = rawSentences.length;

  if (totalSentenceCount === 0 || totalWordCount === 0) {
    return {
      overallAiScore: 0,
      overallOriginalityScore: 100,
      overallPlagiarismScore: 0,
      classification: 'Likely Human',
      isOnlineMode: onlineMode,
      neuralModelUsed: neuralModelName,
      metrics: {
        wordCount: 0,
        characterCount: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
        burstinessScore: 1.0,
        perplexityScore: 5.0,
        lexicalDiversity: 1.0,
        readingGradeLevel: 0,
        readingTimeMinutes: 0,
      },
      sentences: [],
      webSources: [],
      internalDuplicates: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // 1. Calculate Document-Level Burstiness
  const sentenceWordCounts = rawSentences.map(s => tokenizeWords(s.text).length);
  const avgSentenceLength = totalWordCount / Math.max(1, totalSentenceCount);

  // Variance & Standard Deviation of sentence length
  const variance = sentenceWordCounts.reduce((acc, len) => acc + Math.pow(len - avgSentenceLength, 2), 0) / Math.max(1, totalSentenceCount);
  const stdDev = Math.sqrt(variance);
  const burstinessScore = Math.min(2.0, stdDev / (avgSentenceLength + 0.001));

  // 2. Calculate Lexical Diversity (Type-Token Ratio & Unique Words)
  const uniqueWords = new Set(totalWords);
  const lexicalDiversity = uniqueWords.size / Math.max(1, totalWordCount);

  // 3. Syllables and Reading Grade
  let totalSyllables = 0;
  for (const w of totalWords) {
    totalSyllables += countSyllables(w);
  }
  const readingGradeLevel = calculateReadingGrade(totalWordCount, totalSentenceCount, totalSyllables);
  const readingTimeMinutes = Math.max(1, Math.round((totalWordCount / 225) * 10) / 10);

  // 4. Offline Reference Document Comparison (if provided)
  const refWords = referenceText ? tokenizeWords(referenceText) : [];
  const refShingles = refWords.length > 0 ? new Set(createShingles(refWords, 4)) : new Set<string>();

  // 5. Sentence-Level AI & Plagiarism Evaluation
  const sentenceAnalyses: SentenceAnalysis[] = [];
  let totalAiScoreAccumulator = 0;
  let totalPerplexityAccumulator = 0;
  let plagiarizedSentenceCount = 0;

  const sentenceShingleSets: { index: number; shingles: Set<string> }[] = [];

  for (let i = 0; i < rawSentences.length; i++) {
    const s = rawSentences[i];
    const sWords = tokenizeWords(s.text);
    const sWordCount = sWords.length;

    // Perplexity
    const sentencePerplexity = computeSentencePerplexity(sWords);
    totalPerplexityAccumulator += sentencePerplexity;

    // Burstiness relative to document average
    const lengthDeviation = Math.abs(sWordCount - avgSentenceLength);
    const relativeBurstiness = lengthDeviation / (avgSentenceLength + 0.001);

    // AI Pattern Matching
    let aiMarkerHits = 0;
    for (const pattern of AI_MARKER_PATTERNS) {
      if (pattern.test(s.text)) {
        aiMarkerHits++;
      }
    }

    let sentenceAiScore = 45; // baseline neutral

    // Low perplexity penalty
    if (sentencePerplexity < 3.2) sentenceAiScore += 25;
    else if (sentencePerplexity < 3.8) sentenceAiScore += 15;
    else if (sentencePerplexity > 5.2) sentenceAiScore -= 25;
    else if (sentencePerplexity > 4.5) sentenceAiScore -= 15;

    // Burstiness penalty/bonus
    if (burstinessScore < 0.35) sentenceAiScore += 20;
    else if (burstinessScore < 0.5) sentenceAiScore += 10;
    else if (burstinessScore > 0.85) sentenceAiScore -= 20;

    // Uniform sentence length modifier
    if (relativeBurstiness < 0.15 && sWordCount > 12) sentenceAiScore += 12;

    // AI marker hits
    if (aiMarkerHits > 0) {
      sentenceAiScore += aiMarkerHits * 22;
    }

    // Lexical diversity modifier
    if (lexicalDiversity < 0.45) sentenceAiScore += 10;
    else if (lexicalDiversity > 0.75) sentenceAiScore -= 10;

    if (sWordCount < 5) {
      sentenceAiScore = Math.min(sentenceAiScore, 40);
    }

    // If neural classification scores exist for this sentence, blend with 70% weight
    if (neuralScores && typeof neuralScores[i] === 'number') {
      const nScore = neuralScores[i];
      sentenceAiScore = Math.round(nScore * 0.7 + sentenceAiScore * 0.3);
    }

    sentenceAiScore = Math.max(2, Math.min(98, Math.round(sentenceAiScore)));
    totalAiScoreAccumulator += sentenceAiScore;

    let category: 'human' | 'mixed' | 'likely_ai' | 'heavy_ai';
    let explanation: string;

    if (sentenceAiScore < 28) {
      category = 'human';
      explanation = neuralModelName 
        ? `Verified as Human writing by local neural model (${neuralModelName}).`
        : 'Natural burstiness and high vocabulary entropy consistent with human writing.';
    } else if (sentenceAiScore < 58) {
      category = 'mixed';
      explanation = 'Moderate perplexity. Contains a mix of organic patterns and standard phrasing.';
    } else if (sentenceAiScore < 82) {
      category = 'likely_ai';
      explanation = neuralModelName
        ? `Classified with ${sentenceAiScore}% AI probability by neural model (${neuralModelName}).`
        : (aiMarkerHits > 0
          ? 'Contains predictable AI transitional marker phrases and uniform clause length.'
          : 'Low burstiness and high structural predictability typical of language models.');
    } else {
      category = 'heavy_ai';
      explanation = neuralModelName
        ? `Strong AI signature detected by neural model (${neuralModelName}).`
        : 'Strong statistical signature of automated generative text with low perplexity.';
    }

    // Check Local Reference Document Plagiarism
    let isPlagiarized = false;
    let plagiarismMatch: SentenceAnalysis['plagiarismMatch'] = undefined;

    const sShingles = new Set(createShingles(sWords, 4));
    sentenceShingleSets.push({ index: i, shingles: sShingles });

    if (refShingles.size > 0 && sShingles.size > 0) {
      // Use containment (how much of the sentence is in the document) instead of Jaccard
      const containment = calculateContainment(sShingles, refShingles);
      if (containment >= 0.45) {
        isPlagiarized = true;
        plagiarizedSentenceCount++;
        plagiarismMatch = {
          source: 'Reference Document',
          similarity: Math.round(containment * 100),
          snippet: s.text,
        };
      }
    }

    sentenceAnalyses.push({
      id: i + 1,
      text: s.text,
      start: s.start,
      end: s.end,
      wordCount: sWordCount,
      perplexity: Math.round(sentencePerplexity * 100) / 100,
      burstiness: Math.round(relativeBurstiness * 100) / 100,
      aiScore: sentenceAiScore,
      category,
      explanation,
      isPlagiarized,
      plagiarismMatch,
    });
  }

  // 6. Internal Duplicate Cross-Checking (Self-Plagiarism)
  const internalDuplicates: { sentenceIndexA: number; sentenceIndexB: number; similarity: number }[] = [];
  for (let i = 0; i < sentenceShingleSets.length; i++) {
    for (let j = i + 1; j < sentenceShingleSets.length; j++) {
      if (sentenceShingleSets[i].shingles.size >= 2 && sentenceShingleSets[j].shingles.size >= 2) {
        const sim = calculateJaccardSimilarity(sentenceShingleSets[i].shingles, sentenceShingleSets[j].shingles);
        if (sim > 0.6) {
          internalDuplicates.push({
            sentenceIndexA: i + 1,
            sentenceIndexB: j + 1,
            similarity: Math.round(sim * 100),
          });
        }
      }
    }
  }

  // 7. Online Web Plagiarism Search (if enabled)
  const webSources: WebSourceMatch[] = [];
  if (onlineMode) {
    const candidateSentences = [...sentenceAnalyses]
      .filter(s => s.wordCount >= 8)
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, 4);

    const searchTasks = candidateSentences.map(async (cand) => {
      const candWords = tokenizeWords(cand.text).filter(w => !COMMON_STOPWORDS.has(w));
      if (candWords.length >= 4) {
        const querySnippet = candWords.slice(0, 7).join(' ');
        const searchHits = await searchWebForSnippet(querySnippet);
        return { cand, candWords, searchHits };
      }
      return { cand, candWords: [], searchHits: [] };
    });

    const taskResults = await Promise.allSettled(searchTasks);
    const seenUrls = new Set<string>();

    for (const res of taskResults) {
      if (res.status === 'fulfilled') {
        const { cand, candWords, searchHits } = res.value;
        for (const hit of searchHits) {
          if (!hit.url || seenUrls.has(hit.url)) continue;

          const hitShingles = new Set(createShingles(tokenizeWords(hit.snippet), 3));
          const candShingles = new Set(createShingles(tokenizeWords(cand.text), 3));
          const matchSim = calculateJaccardSimilarity(candShingles, hitShingles);

          if (matchSim > 0.15 || (candWords.length >= 3 && hit.snippet.toLowerCase().includes(candWords.slice(0, 3).join(' ')))) {
            const calculatedMatch = Math.min(100, Math.round(Math.max(35, matchSim * 100)));
            seenUrls.add(hit.url);

            webSources.push({
              title: hit.title || 'Online Source',
              url: hit.url,
              snippet: hit.snippet,
              matchPercentage: calculatedMatch,
              matchedText: cand.text,
            });

            cand.isPlagiarized = true;
            cand.plagiarismMatch = {
              source: hit.title || 'Web Search Match',
              url: hit.url,
              similarity: calculatedMatch,
              snippet: hit.snippet,
            };
            plagiarizedSentenceCount++;
          }
        }
      }
    }
  }

  // 8. Aggregated Document-Level Scores
  const rawOverallAi = totalSentenceCount > 0 ? Math.round(totalAiScoreAccumulator / totalSentenceCount) : 0;
  let overallAiScore = rawOverallAi;
  if (burstinessScore > 0.9) overallAiScore = Math.max(4, overallAiScore - 15);
  if (burstinessScore < 0.3) overallAiScore = Math.min(96, overallAiScore + 12);
  overallAiScore = Math.max(0, Math.min(100, overallAiScore));

  const plagiarismRatio = totalSentenceCount > 0 ? plagiarizedSentenceCount / totalSentenceCount : 0;
  const webMatchBonus = webSources.length > 0 ? Math.min(40, webSources.length * 15) : 0;
  const overallPlagiarismScore = Math.min(100, Math.round((plagiarismRatio * 60) + webMatchBonus));
  const overallOriginalityScore = Math.max(0, 100 - overallPlagiarismScore);

  let classification: DetectorResult['classification'];
  if (overallAiScore < 20) classification = 'Highly Likely Human';
  else if (overallAiScore < 45) classification = 'Likely Human';
  else if (overallAiScore < 70) classification = 'Mixed Content';
  else if (overallAiScore < 85) classification = 'Likely AI-Generated';
  else classification = 'Heavy AI-Generated';

  return {
    overallAiScore,
    overallOriginalityScore,
    overallPlagiarismScore,
    classification,
    isOnlineMode: onlineMode,
    metrics: {
      wordCount: totalWordCount,
      characterCount: text.length,
      sentenceCount: totalSentenceCount,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      burstinessScore: Math.round(burstinessScore * 100) / 100,
      perplexityScore: Math.round((totalPerplexityAccumulator / Math.max(1, totalSentenceCount)) * 100) / 100,
      lexicalDiversity: Math.round(lexicalDiversity * 100) / 100,
      readingGradeLevel,
      readingTimeMinutes,
    },
    sentences: sentenceAnalyses,
    webSources,
    internalDuplicates,
    generatedAt: new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  };
}
