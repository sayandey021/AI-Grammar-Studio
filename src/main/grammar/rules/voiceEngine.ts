import nlp from 'compromise';

export interface VoiceTransformationResult {
  type: 'voice';
  originalVoice: 'Active Voice' | 'Passive Voice' | 'Intransitive (No Voice Change)' | 'Imperative Sentence' | 'Quasi-Passive' | 'Interrogative Sentence' | 'Compound Sentence' | 'Complex Sentence' | 'Unknown';
  convertedVoice: string;
  convertedText: string;
  subject: string;
  verb: string;
  object: string;
  explanation: string;
  exceptionsApplied?: string[];
  tense?: string;
  sentenceType?: string;
}

// ----------------------------------------------------------------------
// 1. Complete Irregular Verbs Dictionary (V1: Base, V2: Past, V3: Participle)
// ----------------------------------------------------------------------
export const IRREGULAR_VERBS: Record<string, { base: string; past: string; participle: string }> = {
  // Invariable Verbs (V1 = V2 = V3)
  shut: { base: 'shut', past: 'shut', participle: 'shut' },
  must: { base: 'must', past: 'must', participle: 'must' },
  offer: { base: 'offer', past: 'offered', participle: 'offered' },
  suffer: { base: 'suffer', past: 'suffered', participle: 'suffered' },
  enter: { base: 'enter', past: 'entered', participle: 'entered' },
  listen: { base: 'listen', past: 'listened', participle: 'listened' },
  open: { base: 'open', past: 'opened', participle: 'opened' },
  happen: { base: 'happen', past: 'happened', participle: 'happened' },
  visit: { base: 'visit', past: 'visited', participle: 'visited' },
  develop: { base: 'develop', past: 'developed', participle: 'developed' },
  cancel: { base: 'cancel', past: 'canceled', participle: 'canceled' },
  cut: { base: 'cut', past: 'cut', participle: 'cut' },
  hit: { base: 'hit', past: 'hit', participle: 'hit' },
  hurt: { base: 'hurt', past: 'hurt', participle: 'hurt' },
  let: { base: 'let', past: 'let', participle: 'let' },
  put: { base: 'put', past: 'put', participle: 'put' },
  set: { base: 'set', past: 'set', participle: 'set' },
  cost: { base: 'cost', past: 'cost', participle: 'cost' },
  spread: { base: 'spread', past: 'spread', participle: 'spread' },
  split: { base: 'split', past: 'split', participle: 'split' },
  quit: { base: 'quit', past: 'quit', participle: 'quit' },
  cast: { base: 'cast', past: 'cast', participle: 'cast' },
  broadcast: { base: 'broadcast', past: 'broadcast', participle: 'broadcast' },
  shed: { base: 'shed', past: 'shed', participle: 'shed' },
  burst: { base: 'burst', past: 'burst', participle: 'burst' },
  read: { base: 'read', past: 'read', participle: 'read' },
  bet: { base: 'bet', past: 'bet', participle: 'bet' },
  bid: { base: 'bid', past: 'bid', participle: 'bidden' },
  slit: { base: 'slit', past: 'slit', participle: 'slit' },
  thrust: { base: 'thrust', past: 'thrust', participle: 'thrust' },
  upset: { base: 'upset', past: 'upset', participle: 'upset' },

  // Standard Irregular Verbs
  be: { base: 'be', past: 'was', participle: 'been' },
  beat: { base: 'beat', past: 'beat', participle: 'beaten' },
  become: { base: 'become', past: 'became', participle: 'become' },
  begin: { base: 'begin', past: 'began', participle: 'begun' },
  bend: { base: 'bend', past: 'bent', participle: 'bent' },
  bind: { base: 'bind', past: 'bound', participle: 'bound' },
  bite: { base: 'bite', past: 'bit', participle: 'bitten' },
  bleed: { base: 'bleed', past: 'bled', participle: 'bled' },
  blow: { base: 'blow', past: 'blew', participle: 'blown' },
  break: { base: 'break', past: 'broke', participle: 'broken' },
  breed: { base: 'breed', past: 'bred', participle: 'bred' },
  bring: { base: 'bring', past: 'brought', participle: 'brought' },
  build: { base: 'build', past: 'built', participle: 'built' },
  burn: { base: 'burn', past: 'burnt', participle: 'burnt' },
  buy: { base: 'buy', past: 'bought', participle: 'bought' },
  catch: { base: 'catch', past: 'caught', participle: 'caught' },
  choose: { base: 'choose', past: 'chose', participle: 'chosen' },
  cling: { base: 'cling', past: 'clung', participle: 'clung' },
  come: { base: 'come', past: 'came', participle: 'come' },
  deal: { base: 'deal', past: 'dealt', participle: 'dealt' },
  dig: { base: 'dig', past: 'dug', participle: 'dug' },
  do: { base: 'do', past: 'did', participle: 'done' },
  draw: { base: 'draw', past: 'drew', participle: 'drawn' },
  dream: { base: 'dream', past: 'dreamt', participle: 'dreamt' },
  drink: { base: 'drink', past: 'drank', participle: 'drunk' },
  drive: { base: 'drive', past: 'drove', participle: 'driven' },
  eat: { base: 'eat', past: 'ate', participle: 'eaten' },
  fall: { base: 'fall', past: 'fell', participle: 'fallen' },
  feed: { base: 'feed', past: 'fed', participle: 'fed' },
  feel: { base: 'feel', past: 'felt', participle: 'felt' },
  fight: { base: 'fight', past: 'fought', participle: 'fought' },
  find: { base: 'find', past: 'found', participle: 'found' },
  flee: { base: 'flee', past: 'fled', participle: 'fled' },
  fly: { base: 'fly', past: 'flew', participle: 'flown' },
  forbid: { base: 'forbid', past: 'forbade', participle: 'forbidden' },
  forget: { base: 'forget', past: 'forgot', participle: 'forgotten' },
  forgive: { base: 'forgive', past: 'forgave', participle: 'forgiven' },
  freeze: { base: 'freeze', past: 'froze', participle: 'frozen' },
  get: { base: 'get', past: 'got', participle: 'gotten' },
  give: { base: 'give', past: 'gave', participle: 'given' },
  go: { base: 'go', past: 'went', participle: 'gone' },
  grind: { base: 'grind', past: 'ground', participle: 'ground' },
  grow: { base: 'grow', past: 'grew', participle: 'grown' },
  hang: { base: 'hang', past: 'hung', participle: 'hung' },
  have: { base: 'have', past: 'had', participle: 'had' },
  hear: { base: 'hear', past: 'heard', participle: 'heard' },
  hide: { base: 'hide', past: 'hid', participle: 'hidden' },
  hold: { base: 'hold', past: 'held', participle: 'held' },
  keep: { base: 'keep', past: 'kept', participle: 'kept' },
  know: { base: 'know', past: 'knew', participle: 'known' },
  lay: { base: 'lay', past: 'laid', participle: 'laid' },
  lead: { base: 'lead', past: 'led', participle: 'led' },
  lean: { base: 'lean', past: 'leant', participle: 'leant' },
  learn: { base: 'learn', past: 'learnt', participle: 'learnt' },
  leave: { base: 'leave', past: 'left', participle: 'left' },
  lend: { base: 'lend', past: 'lent', participle: 'lent' },
  lie: { base: 'lie', past: 'lay', participle: 'lain' },
  light: { base: 'light', past: 'lit', participle: 'lit' },
  lose: { base: 'lose', past: 'lost', participle: 'lost' },
  make: { base: 'make', past: 'made', participle: 'made' },
  mean: { base: 'mean', past: 'meant', participle: 'meant' },
  meet: { base: 'meet', past: 'met', participle: 'met' },
  pay: { base: 'pay', past: 'paid', participle: 'paid' },
  ride: { base: 'ride', past: 'rode', participle: 'ridden' },
  ring: { base: 'ring', past: 'rang', participle: 'rung' },
  rise: { base: 'rise', past: 'rose', participle: 'risen' },
  run: { base: 'run', past: 'ran', participle: 'run' },
  say: { base: 'say', past: 'said', participle: 'said' },
  see: { base: 'see', past: 'saw', participle: 'seen' },
  seek: { base: 'seek', past: 'sought', participle: 'sought' },
  sell: { base: 'sell', past: 'sold', participle: 'sold' },
  send: { base: 'send', past: 'sent', participle: 'sent' },
  shake: { base: 'shake', past: 'shook', participle: 'shaken' },
  shine: { base: 'shine', past: 'shone', participle: 'shone' },
  shoot: { base: 'shoot', past: 'shot', participle: 'shot' },
  shrink: { base: 'shrink', past: 'shrank', participle: 'shrunk' },
  sing: { base: 'sing', past: 'sang', participle: 'sung' },
  sink: { base: 'sink', past: 'sank', participle: 'sunk' },
  sit: { base: 'sit', past: 'sat', participle: 'sat' },
  sleep: { base: 'sleep', past: 'slept', participle: 'slept' },
  slide: { base: 'slide', past: 'slid', participle: 'slid' },
  smell: { base: 'smell', past: 'smelt', participle: 'smelt' },
  speak: { base: 'speak', past: 'spoke', participle: 'spoken' },
  speed: { base: 'speed', past: 'sped', participle: 'sped' },
  spend: { base: 'spend', past: 'spent', participle: 'spent' },
  spill: { base: 'spill', past: 'spilt', participle: 'spilt' },
  spin: { base: 'spin', past: 'spun', participle: 'spun' },
  spit: { base: 'spit', past: 'spat', participle: 'spat' },
  spoil: { base: 'spoil', past: 'spoilt', participle: 'spoilt' },
  stand: { base: 'stand', past: 'stood', participle: 'stood' },
  steal: { base: 'steal', past: 'stole', participle: 'stolen' },
  stick: { base: 'stick', past: 'stuck', participle: 'stuck' },
  sting: { base: 'sting', past: 'stung', participle: 'stung' },
  stink: { base: 'stink', past: 'stank', participle: 'stunk' },
  strike: { base: 'strike', past: 'struck', participle: 'struck' },
  swear: { base: 'swear', past: 'swore', participle: 'sworn' },
  sweep: { base: 'sweep', past: 'swept', participle: 'swept' },
  swim: { base: 'swim', past: 'swam', participle: 'swum' },
  swing: { base: 'swing', past: 'swung', participle: 'swung' },
  take: { base: 'take', past: 'took', participle: 'taken' },
  teach: { base: 'teach', past: 'taught', participle: 'taught' },
  tear: { base: 'tear', past: 'tore', participle: 'torn' },
  tell: { base: 'tell', past: 'told', participle: 'told' },
  think: { base: 'think', past: 'thought', participle: 'thought' },
  throw: { base: 'throw', past: 'threw', participle: 'thrown' },
  understand: { base: 'understand', past: 'understood', participle: 'understood' },
  wake: { base: 'wake', past: 'woke', participle: 'woken' },
  wear: { base: 'wear', past: 'wore', participle: 'worn' },
  win: { base: 'win', past: 'won', participle: 'won' },
  wind: { base: 'wind', past: 'wound', participle: 'wound' },
  withdraw: { base: 'withdraw', past: 'withdrew', participle: 'withdrawn' },
  write: { base: 'write', past: 'wrote', participle: 'written' },
  marry: { base: 'marry', past: 'married', participle: 'married' },
  surprise: { base: 'surprise', past: 'surprised', participle: 'surprised' },
  satisfy: { base: 'satisfy', past: 'satisfied', participle: 'satisfied' },
  please: { base: 'please', past: 'pleased', participle: 'pleased' },
  displease: { base: 'displease', past: 'displeased', participle: 'displeased' },
  contain: { base: 'contain', past: 'contained', participle: 'contained' },
  include: { base: 'include', past: 'included', participle: 'included' },
  cover: { base: 'cover', past: 'covered', participle: 'covered' },
  fill: { base: 'fill', past: 'filled', participle: 'filled' },
  astonish: { base: 'astonish', past: 'astonished', participle: 'astonished' },
  amaze: { base: 'amaze', past: 'amazed', participle: 'amazed' },
  alarm: { base: 'alarm', past: 'alarmed', participle: 'alarmed' },
  disgust: { base: 'disgust', past: 'disgusted', participle: 'disgusted' }
};

// ----------------------------------------------------------------------
// 2. Helper functions for Verb Conjugation (V1 -> V3, V1 -> V2, etc.)
// ----------------------------------------------------------------------
export function getPastParticiple(verb: string): string {
  const lower = verb.toLowerCase().trim();
  
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower].participle;

  for (const k of Object.keys(IRREGULAR_VERBS)) {
    const entry = IRREGULAR_VERBS[k];
    if (entry.base === lower || entry.past === lower) return entry.participle;
  }

  if (lower.endsWith('e')) return `${lower}d`;
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) return `${lower.slice(0, -1)}ied`;
  if (lower.endsWith('c')) return `${lower}ked`;
  
  if (/(^|[^aeiou])[aeiou][bcdfghlmnprstvwxz]$/i.test(lower) && !/w|x|y$/i.test(lower) && lower.length <= 6) {
    return `${lower}${lower.slice(-1)}ed`;
  }

  return `${lower}ed`;
}

export function getSimplePast(verb: string): string {
  const lower = verb.toLowerCase().trim();
  if (IRREGULAR_VERBS[lower]) return IRREGULAR_VERBS[lower].past;
  for (const k of Object.keys(IRREGULAR_VERBS)) {
    const entry = IRREGULAR_VERBS[k];
    if (entry.base === lower || entry.participle === lower) return entry.past;
  }

  if (lower.endsWith('e')) return `${lower}d`;
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) return `${lower.slice(0, -1)}ied`;
  if (/^[a-z]*[aeiou][bcdfghlmnprstvwxz]$/i.test(lower) && !/w|x|y$/i.test(lower) && lower.length <= 6) {
    return `${lower}${lower.slice(-1)}ed`;
  }
  return `${lower}ed`;
}

export function getBaseForm(verb: string): string {
  let lower = verb.toLowerCase().trim();
  for (const k of Object.keys(IRREGULAR_VERBS)) {
    const entry = IRREGULAR_VERBS[k];
    if (entry.base === lower || entry.past === lower || entry.participle === lower) return entry.base;
  }
  
  try {
    const compInfinitive = nlp(lower).verbs().toInfinitive().text();
    if (compInfinitive && compInfinitive !== lower) return compInfinitive;
  } catch (e) {}

  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us') && !lower.endsWith('is')) {
    if (lower.endsWith('ies')) lower = `${lower.slice(0, -3)}y`;
    else if (/[s|x|z|ch|sh]es$/i.test(lower)) lower = lower.slice(0, -2);
    else lower = lower.slice(0, -1);
  }

  for (const k of Object.keys(IRREGULAR_VERBS)) {
    const entry = IRREGULAR_VERBS[k];
    if (entry.base === lower || entry.past === lower || entry.participle === lower) return entry.base;
  }

  if (lower.endsWith('ied')) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith('ed')) {
    if (lower.length > 4 && lower[lower.length - 3] === lower[lower.length - 4]) {
      return lower.slice(0, -3); // e.g. stopped -> stop
    }
    if (/[aeiou][bcdfghlmnprstvwxz]ed$/i.test(lower)) {
      return `${lower.slice(0, -1)}`; // e.g. updated -> update, created -> create
    }
    return lower.slice(0, -2);
  }
  return lower;
}

// ----------------------------------------------------------------------
// 3. Pronoun Mapping (Subjective <-> Objective)
// ----------------------------------------------------------------------
const SUBJECT_TO_OBJECT_PRONOUN: Record<string, string> = {
  i: 'me',
  he: 'him',
  she: 'her',
  we: 'us',
  they: 'them',
  who: 'whom',
  you: 'you',
  it: 'it',
  this: 'this',
  that: 'that',
  these: 'these',
  those: 'those'
};

const OBJECT_TO_SUBJECT_PRONOUN: Record<string, string> = {
  me: 'I',
  him: 'He',
  her: 'She',
  us: 'We',
  them: 'They',
  whom: 'Who',
  you: 'You',
  it: 'It',
  this: 'This',
  that: 'That',
  these: 'These',
  those: 'Those'
};

export function toObjectPronoun(word: string): string {
  const lower = word.toLowerCase().trim();
  return SUBJECT_TO_OBJECT_PRONOUN[lower] || word;
}

export function toSubjectPronoun(word: string): string {
  const lower = word.toLowerCase().trim();
  return OBJECT_TO_SUBJECT_PRONOUN[lower] || (word.charAt(0).toUpperCase() + word.slice(1));
}

// ----------------------------------------------------------------------
// 4. Special Preposition Exceptions (Instead of standard 'by')
// ----------------------------------------------------------------------
export const PREPOSITION_EXCEPTIONS: Record<string, string> = {
  know: 'to',
  marry: 'to',
  surprise: 'at',
  astonish: 'at',
  amaze: 'at',
  alarm: 'at',
  shock: 'at',
  annoy: 'at',
  satisfy: 'with',
  please: 'with',
  displease: 'with',
  disgust: 'with',
  contain: 'in',
  include: 'in',
  fill: 'with',
  cover: 'with',
  adorn: 'with',
  decorate: 'with'
};

export function getPassiveAgentPreposition(verb: string): string {
  const base = getBaseForm(verb);
  return PREPOSITION_EXCEPTIONS[base] || 'by';
}

// ----------------------------------------------------------------------
// 5. Intransitive Verbs Guard
// ----------------------------------------------------------------------
export const INTRANSITIVE_VERBS = new Set([
  'sleep', 'die', 'run', 'arrive', 'go', 'exist', 'happen', 'lie', 'sit',
  'laugh', 'vanish', 'occur', 'come', 'rise', 'fall', 'disappear', 'live',
  'remain', 'seem', 'appear', 'belong', 'stay', 'cry', 'smile', 'wait', 'be'
]);

export function isIntransitiveVerb(verb: string): boolean {
  const base = getBaseForm(verb);
  return INTRANSITIVE_VERBS.has(base);
}

// Helper to capitalize first character cleanly
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Particle/Phrasal verb list (e.g. look into, laugh at, listen to, look after, take care of, lose sight of)
export const PREPOSITIONAL_VERBS = new Set([
  'laugh at', 'look into', 'listen to', 'look after', 'take care of', 'lose sight of', 'shed tears over',
  'speak to', 'run over', 'break into', 'knock at', 'rely on', 'depend on',
  'account for', 'call for', 'agree to', 'approve of', 'belong to',
  'care for', 'comply with', 'consist of', 'deal with', 'insist on',
  'look for', 'object to', 'pay for', 'refer to', 'search for', 'look upon', 'write off',
  'make fun of', 'take care of', 'catch sight of', 'pay attention to', 'put up with', 'cope with', 'wind up'
]);

export const STATIVE_TRANSITIVE_VERBS = new Set([
  'fit', 'lack', 'have', 'resemble', 'suit', 'equal', 'cost', 'weigh', 'contain', 'hold', 'marry'
]);

export function isStativeTransitiveVerb(verb: string): boolean {
  return STATIVE_TRANSITIVE_VERBS.has(getBaseForm(verb));
}

export interface VoiceEngineOptions {
  forceSubjunctive?: boolean;
  skipAST?: boolean;
}

// ----------------------------------------------------------------------
// 6. Main Voice Change Transformation Algorithm
// ----------------------------------------------------------------------
export function transformVoice(rawText: string, options: VoiceEngineOptions = {}): VoiceTransformationResult {
  const sentenceText = rawText.trim().replace(/\s+/g, ' ');
  if (!sentenceText) {
    return {
      type: 'voice',
      originalVoice: 'Unknown',
      convertedVoice: 'N/A',
      convertedText: rawText,
      subject: '',
      verb: '',
      object: '',
      explanation: 'Please enter a sentence to perform voice transformation.'
    };
  }

  const doc = nlp(sentenceText);
  const exceptionsApplied: string[] = [];

  // --------------------------------------------------------------------
  // Phase 3 & 4: Recursive AST Clause Splitter & Correlatives
  // --------------------------------------------------------------------
  
  // Stative Transitive Guard
  const stativeTestVerb = doc.verbs().first().text();
  if (isStativeTransitiveVerb(stativeTestVerb)) {
    let bypassStative = false;
    const baseStative = getBaseForm(stativeTestVerb);
    
    // Phase 7: Bypass guard for Causative Have
    if (baseStative === 'have' || baseStative === 'has' || baseStative === 'had') {
      const causMatch = sentenceText.match(/^([a-zA-Z]+)\s+(have|has|had)\s+((?:the\s+|a\s+|an\s+|my\s+|his\s+|her\s+|our\s+|their\s+|some\s+|any\s+)?[a-zA-Z]+|[A-Z][a-z]+|him|her|me|us|them|you)\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
      if (causMatch && getBaseForm(causMatch[4]) === causMatch[4] && !['the', 'a', 'an', 'some', 'my', 'his', 'her', 'their', 'our', 'your'].includes(causMatch[4])) {
        bypassStative = true;
      }
    }
    
    if (!bypassStative) {
      return {
        type: 'voice',
        originalVoice: 'Active Voice',
        convertedVoice: 'N/A',
        convertedText: 'No passive voice possible. (The verb expresses a state, not an action).',
        subject: '', verb: '', object: '',
        explanation: 'Stative transitive verbs cannot be passivized.'
      };
    }
  }

  if (!options.skipAST) {
    // Phase 5: Multi-Agent Correlative Clashing (While/Although/Since/When/If/Because X, Y)
    const startConjunctionMatch = sentenceText.match(/^(while|although|because|since|when|if)\s+(.+?),\s*(.+)$/i);
    if (startConjunctionMatch) {
      const conjunction = startConjunctionMatch[1];
      const leftResult = transformVoice(startConjunctionMatch[2].trim());
      const rightResult = transformVoice(startConjunctionMatch[3].trim());
      
      let leftText = leftResult.convertedText.replace(/[.,!?]$/, '').trim();
      let rightText = rightResult.convertedText.trim();
      
      // Ensure lowercasing for inner clause
      if (leftText.split(/\s+/)[0] !== 'I' && !nlp(leftText.split(/\s+/)[0]).has('#ProperNoun')) {
        leftText = leftText.charAt(0).toLowerCase() + leftText.slice(1);
      }
      if (rightText.split(/\s+/)[0] !== 'I' && !nlp(rightText.split(/\s+/)[0]).has('#ProperNoun')) {
        rightText = rightText.charAt(0).toLowerCase() + rightText.slice(1);
      }
      
      return {
        type: 'voice',
        originalVoice: 'Complex Sentence',
        convertedVoice: 'Passive Voice',
        convertedText: `${capitalize(conjunction)} ${leftText}, ${rightText.replace(/[.,!?]$/, '')}.`,
        subject: 'Compound', verb: 'Compound', object: 'Compound',
        explanation: 'Multi-Clause Correlative transformed.'
      };
    }

    // Multi-Clause Correlatives: As X, so Y
    const correlativeMatch = sentenceText.match(/^as\s+(.+?),\s*so\s+(.+)$/i);
    if (correlativeMatch) {
      const leftResult = transformVoice(correlativeMatch[1].trim());
      const rightResult = transformVoice(correlativeMatch[2].trim());
      
      let leftText = leftResult.convertedText.replace(/[.,!?]$/, '').trim();
      let rightText = rightResult.convertedText.trim();
      
      if (leftText.split(/\s+/)[0] !== 'I' && !nlp(leftText.split(/\s+/)[0]).has('#ProperNoun')) {
        leftText = leftText.charAt(0).toLowerCase() + leftText.slice(1);
      }
      if (rightText.split(/\s+/)[0] !== 'I' && !nlp(rightText.split(/\s+/)[0]).has('#ProperNoun')) {
        rightText = rightText.charAt(0).toLowerCase() + rightText.slice(1);
      }
      
      return {
        type: 'voice',
        originalVoice: 'Compound Sentence',
        convertedVoice: 'Passive Voice',
        convertedText: `As ${leftText}, so ${rightText.replace(/[.,!?]$/, '')}.`,
        subject: 'Compound', verb: 'Compound', object: 'Compound',
        explanation: 'Multi-Clause Correlative transformed.'
      };
    }

    // Phase 5: "It is time" Infinitive
    // e.g. "It is time to wind up the meeting." -> "It is time for the meeting to be wound up."
    const itIsTimeMatch = sentenceText.match(/^It is time to\s+(.+)$/i);
    if (itIsTimeMatch) {
      const activeRest = itIsTimeMatch[1].replace(/[.,!?]$/, '').trim();
      const tempActive = `They ${activeRest}.`;
      const tempRes = transformVoice(tempActive, { skipAST: true });
      if (tempRes.originalVoice !== 'Intransitive (No Voice Change)' && tempRes.originalVoice !== 'Unknown') {
        let pText = tempRes.convertedText.replace(/[.,!?]$/, '').trim();
        // pText is like "The meeting is wound up" or "The electricity bill is paid"
        // Replace " is/are/was/were [v3]" with " to be [v3]"
        pText = pText.replace(/\b(is|are|was|were)\b/i, 'to be');
        
        return {
          type: 'voice',
          originalVoice: 'Active Voice',
          convertedVoice: 'Passive Voice',
          convertedText: `It is time for ${pText.charAt(0).toLowerCase() + pText.slice(1)}.`,
          subject: 'Compound', verb: 'Compound', object: 'Compound',
          explanation: '"It is time" infinitive transformed into passive voice.',
          exceptionsApplied: ['It Is Time Exception']
        };
      }
    }

    // Phase 7: Perfect Infinitive Matrix
    // e.g. "They claim to have solved the puzzle." -> "The puzzle is claimed to have been solved."
    const perfectInfMatch = sentenceText.match(/^([a-zA-Z]+)\s+(claim|claims|claimed|report|reports|reported|say|says|said|believe|believes|believed|think|thinks|thought)\s+to\s+have\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
    if (perfectInfMatch) {
      const perfSubj = perfectInfMatch[1];
      const perfReportV = perfectInfMatch[2];
      const perfV3 = perfectInfMatch[3];
      const perfObj = perfectInfMatch[4];
      
      // Ensure perfV3 is an actual participle, we check if it matches its past participle form or is irregular
      if (getPastParticiple(getBaseForm(perfV3)) === perfV3.toLowerCase()) {
        const isPast = /ed$|said|thought/i.test(perfReportV);
        const isPluralObj = nlp(perfObj).has('#Plural');
        const aux = isPast ? (isPluralObj ? 'were' : 'was') : (isPluralObj ? 'are' : 'is');
        const reportV3 = getPastParticiple(getBaseForm(perfReportV));
        
        let agent = ` by ${toObjectPronoun(perfSubj).toLowerCase()}`;
        if (new Set(['they', 'people', 'someone', 'somebody', 'one', 'nobody']).has(perfSubj.toLowerCase())) {
          agent = '';
        }
        
        return {
          type: 'voice',
          originalVoice: 'Active Voice',
          convertedVoice: 'Passive Voice',
          convertedText: `${capitalize(perfObj)} ${aux} ${reportV3} to have been ${perfV3}${agent}.`,
          subject: 'Compound', verb: 'Compound', object: 'Compound',
          explanation: 'Perfect infinitive matrix transformed into passive voice.',
          exceptionsApplied: ['Perfect Infinitive Exception']
        };
      }
    }

    // Phase 7: Adjectival Infinitive (The "It is [Adjective]" Trap)
    // e.g. "It is impossible to finish the work today." -> "The work is impossible to be finished today."
    const adjectivalInfMatch = sentenceText.match(/^It\s+(is|was)\s+([a-zA-Z]+)\s+to\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
    if (adjectivalInfMatch && !['time', 'expected', 'said', 'believed', 'reported'].includes(adjectivalInfMatch[2].toLowerCase())) {
      const adjAux = adjectivalInfMatch[1];
      const adjWord = adjectivalInfMatch[2];
      const adjV1 = adjectivalInfMatch[3];
      const adjObjRest = adjectivalInfMatch[4];
      
      const tempActive = `They ${adjV1} ${adjObjRest}.`;
      const tempRes = transformVoice(tempActive, { skipAST: true });
      if (tempRes.originalVoice !== 'Intransitive (No Voice Change)' && tempRes.originalVoice !== 'Unknown') {
        let pText = tempRes.convertedText.replace(/[.,!?]$/, '').trim();
        // Replace the auxiliary with the adjective structure
        pText = pText.replace(/\b(is|are|was|were)\b/i, `${adjAux} ${adjWord} to be`);
        
        return {
          type: 'voice',
          originalVoice: 'Active Voice',
          convertedVoice: 'Passive Voice',
          convertedText: `${capitalize(pText)}.`,
          subject: 'Compound', verb: 'Compound', object: 'Compound',
          explanation: 'Adjectival infinitive structure transformed to passive voice.',
          exceptionsApplied: ['Adjectival Infinitive Exception']
        };
      }
    }

    // Phase 5: Bare Infinitive Deception
    // e.g. "I observed the tension bid him speak the truth." -> "He was observed to be bidden by the tension to speak the truth."
    const bareInfinitiveMatch = sentenceText.match(/^([a-zA-Z]+)\s+(observe|observed|hear|heard|see|saw|watch|watched|feel|felt)\s+(.+?)\s+([a-z]+)\s+(him|her|them|me|us)\s+([a-z]+)\s+(.+)$/i);
    if (bareInfinitiveMatch) {
      const v1 = bareInfinitiveMatch[2];
      const obj1 = bareInfinitiveMatch[3];
      const v2 = bareInfinitiveMatch[4];
      const obj2 = bareInfinitiveMatch[5];
      const v3 = bareInfinitiveMatch[6];
      const obj3 = bareInfinitiveMatch[7].replace(/[.,!?]$/, '').trim();

      const newSubj = toSubjectPronoun(obj2);
      const isPast = doc.has('#PastTense') || getSimplePast(getBaseForm(v1)) === v1.toLowerCase();
      const aux1 = isPast ? 'was' : 'is'; // assuming newSubj is he/she/I/it, we can hardcode for simplicity or use logic
      const auxFinal = (newSubj === 'You' || newSubj === 'They' || newSubj === 'We') ? (isPast ? 'were' : 'are') : (newSubj === 'I' && !isPast ? 'am' : aux1);
      
      const v1_3 = getPastParticiple(getBaseForm(v1));
      const v2_3 = getPastParticiple(getBaseForm(v2));

      return {
        type: 'voice',
        originalVoice: 'Active Voice',
        convertedVoice: 'Passive Voice',
        convertedText: `${newSubj} ${auxFinal} ${v1_3} to be ${v2_3} by ${obj1} to ${v3} ${obj3}.`,
        subject: newSubj, verb: `${v1} ... ${v2}`, object: obj1,
        explanation: 'Double bare infinitive chain passivized with primary subject omitted.',
        exceptionsApplied: ['Bare Infinitive Deception Exception']
      };
    }

    // Phase 5: Double-Infinitive Matrix
    // e.g. "I want him to invite her to play the piano." -> "I want her to be invited by him to play the piano."
    const doubleInfinitiveMatch = sentenceText.match(/^([a-zA-Z]+)\s+([a-z]+(?:ed|s)?)\s+([a-zA-Z]+)\s+to\s+([a-z]+)\s+([a-zA-Z]+)\s+to\s+([a-z]+)\s+(.+)$/i);
    if (doubleInfinitiveMatch) {
      const subj1 = doubleInfinitiveMatch[1];
      const v1 = doubleInfinitiveMatch[2];
      const obj1 = doubleInfinitiveMatch[3];
      const v2 = doubleInfinitiveMatch[4];
      const obj2 = doubleInfinitiveMatch[5];
      const v3 = doubleInfinitiveMatch[6];
      const obj3 = doubleInfinitiveMatch[7].replace(/[.,!?]$/, '').trim();

      const v2_3 = getPastParticiple(getBaseForm(v2));

      return {
        type: 'voice',
        originalVoice: 'Active Voice',
        convertedVoice: 'Passive Voice',
        convertedText: `${capitalize(subj1)} ${v1} ${obj2} to be ${v2_3} by ${obj1} to ${v3} ${obj3}.`,
        subject: subj1, verb: `${v1} ... to ${v2}`, object: obj2,
        explanation: 'Double infinitive chain inner passivization.',
        exceptionsApplied: ['Double-Infinitive Matrix Exception']
      };
    }
    
    // Phase 7: Causative "Have" / "Get"
    // e.g. "I had the barber cut my hair." -> "I had my hair cut by the barber."
    const causativeHaveMatch = sentenceText.match(/^([a-zA-Z]+)\s+(have|has|had)\s+((?:the\s+|a\s+|an\s+|my\s+|his\s+|her\s+|our\s+|their\s+|some\s+|any\s+)?[a-zA-Z]+|[A-Z][a-z]+|him|her|me|us|them|you)\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
    if (causativeHaveMatch) {
      const causSubj = causativeHaveMatch[1];
      const causAux = causativeHaveMatch[2];
      const causAgent = causativeHaveMatch[3];
      const causVerb = causativeHaveMatch[4];
      const causObj = causativeHaveMatch[5];
      
      // Verify causVerb is a base form verb (excluding 'to', determiners, etc)
      if (getBaseForm(causVerb) === causVerb && !['the', 'a', 'an', 'some', 'my', 'his', 'her', 'their', 'our', 'your'].includes(causVerb)) {
        const causV3 = getPastParticiple(causVerb);
        return {
          type: 'voice',
          originalVoice: 'Active Voice',
          convertedVoice: 'Passive Voice',
          convertedText: `${capitalize(causSubj)} ${causAux} ${causObj} ${causV3} by ${causAgent.toLowerCase()}.`,
          subject: 'Compound', verb: 'Compound', object: 'Compound',
          explanation: 'Causative "have" transformed to passive voice while retaining the causative structure.',
          exceptionsApplied: ['Causative Have Exception']
        };
      }
    }

    // Phase 5: Mid-Sentence Gerund/Clitic/Gerund Phase
    // e.g. "He resented his peers making fun of his accent."
    const midGerundMatch = sentenceText.match(/^(.+?)\s+([a-z]+(?:ed|s)?)\s+(his|her|their|my|our|your|[a-z]+'s|him|them|us|me)\s+([a-z]+(?:s)?)\s+([a-z]+ing)\s+(.+)$/i);
    if (midGerundMatch) {
      const subj1 = midGerundMatch[1];
      const v1 = midGerundMatch[2];
      const subj2_poss = midGerundMatch[3];
      const subj2_noun = midGerundMatch[4];
      const gerund = midGerundMatch[5];
      const objText = midGerundMatch[6].replace(/[.,!?]$/, '').trim();

      // Ensure v1 is a transitive verb that allows this structure (resent, hate, mind, like)
      if (/resent|hate|mind|like|love|dislike|enjoy|tolerate/i.test(getBaseForm(v1))) {
        // Passivize the gerund clause: "his peers making fun of his accent" -> "his accent being made fun of by his peers"
        // Wait, "fun of his accent" is the object. "making fun of" is a phrasal verb.
        // It's safer to just recursively call transformVoice on the gerund clause converted to active:
        // "his peers made fun of his accent" -> "his accent was made fun of by his peers"
        // Then replace "was/were [v3]" with "being [v3]"
        const activeGerundStandard = `${subj2_poss} ${subj2_noun} ${getSimplePast(getBaseForm(gerund))} ${objText}.`;
        const innerPass = transformVoice(activeGerundStandard, { skipAST: true });
        
        if (innerPass.originalVoice !== 'Intransitive (No Voice Change)' && innerPass.originalVoice !== 'Unknown') {
          let pText = innerPass.convertedText.replace(/[.,!?]$/, '').trim();
          pText = pText.replace(/\b(is|am|are|was|were)\s+([a-z]+)\b/i, 'being $2');
          
          return {
            type: 'voice',
            originalVoice: 'Complex Sentence',
            convertedVoice: 'Passive Voice',
            convertedText: `${capitalize(subj1)} ${v1} ${pText.charAt(0).toLowerCase() + pText.slice(1)}.`,
            subject: 'Compound', verb: 'Compound', object: 'Compound',
            explanation: 'Transformed inner gerund clause to passive voice.',
            exceptionsApplied: ['Mid-Sentence Gerund Exception']
          };
        }
      }
    }

    // Phase 5: Preposition-Staking Trap Guard (Compound Verbs sharing an object)
    // e.g. "laughed at and jeered the speaker"
    const prepStakingMatch = sentenceText.match(/^(.+?)\s+([a-z]+(?:ed|s|ing)?)\s+(at|to|for|with|in|on|of|about)\s+(and|or)\s+([a-z]+(?:ed|s|ing)?)\s+(.+)$/i);
    if (prepStakingMatch) {
      const subject = prepStakingMatch[1];
      const v1 = prepStakingMatch[2];
      const prep = prepStakingMatch[3];
      const conj = prepStakingMatch[4];
      const v2 = prepStakingMatch[5];
      const obj = prepStakingMatch[6].replace(/[.,!?]$/, '').trim();
      
      const v3_1 = getPastParticiple(getBaseForm(v1));
      const v3_2 = getPastParticiple(getBaseForm(v2));
      
      const isPast = doc.has('#PastTense') || getSimplePast(getBaseForm(v1)) === v1.toLowerCase();
      const isPluralSubject = nlp(obj).has('#Plural');
      const aux = isPast ? (isPluralSubject ? 'were' : 'was') : (isPluralSubject ? 'are' : 'is');
      const lowerSubj = subject === 'I' ? 'me' : (nlp(subject).has('#ProperNoun') ? subject : subject.charAt(0).toLowerCase() + subject.slice(1));
      
      return {
        type: 'voice',
        originalVoice: 'Active Voice',
        convertedVoice: 'Passive Voice',
        convertedText: `${capitalize(obj)} ${aux} ${v3_1} ${prep} ${conj} ${v3_2} by ${lowerSubj}.`,
        subject: subject, verb: `${v1} ${prep} ${conj} ${v2}`, object: obj,
        explanation: 'Transformed compound verbs with shared object into passive voice.',
        exceptionsApplied: ['Preposition-Staking Exception']
      };
    }

    // Phase 5: Adjunct Inversion (Adverbial Fronting)
    // e.g. "Seldom do people witness such a magnificent celestial event."
    const adjunctInversionMatch = sentenceText.match(/^(seldom|rarely|barely|hardly|scarcely|never|not only)\s+(do|does|did|have|has|had|will|can|could|should|would|is|am|are|was|were)\s+(.+?)\s+([a-z]+(?:ed|s|ing)?)\s+(.+)$/i);
    if (adjunctInversionMatch) {
      const adv = adjunctInversionMatch[1];
      const aux = adjunctInversionMatch[2];
      const subj = adjunctInversionMatch[3];
      const verb = adjunctInversionMatch[4];
      const obj = adjunctInversionMatch[5].replace(/[.,!?]$/, '').trim();

      let activeStandard = `${subj} ${aux} ${verb} ${obj}.`;
      if (/^(do|does)$/i.test(aux)) {
        activeStandard = `${subj} ${verb} ${obj}.`;
      } else if (/^did$/i.test(aux)) {
        activeStandard = `${subj} ${getSimplePast(verb)} ${obj}.`;
      }

      const standardPassiveResult = transformVoice(activeStandard, { skipAST: true });
      if (standardPassiveResult.originalVoice !== 'Intransitive (No Voice Change)' && standardPassiveResult.originalVoice !== 'Unknown') {
        let pText = standardPassiveResult.convertedText.replace(/[.,!?]$/, '').trim();
        // The passive sentence might look like "Such an event was witnessed by people"
        // We need to pull the first auxiliary out and place it after the adverb
        const pTokens = pText.split(/\s+/);
        const pAuxIdx = pTokens.findIndex(t => /^(is|are|was|were|has|have|had|will|can|could|should|would|be|been|being)$/i.test(t));
        if (pAuxIdx !== -1) {
          const pAux = pTokens[pAuxIdx];
          pTokens.splice(pAuxIdx, 1); // remove aux
          const newPassive = `${capitalize(adv)} ${pAux.toLowerCase()} ${pTokens.join(' ').toLowerCase()}.`;
          
          return {
            type: 'voice',
            originalVoice: 'Active Voice',
            convertedVoice: 'Passive Voice',
            convertedText: newPassive,
            subject: subj, verb: verb, object: obj,
            explanation: 'Re-inverted adverbial fronting in passive voice.',
            exceptionsApplied: ['Adjunct Inversion Exception']
          };
        }
      }
    }

    const conjunctionRegex = /\b(and|but|because|although|when|while|if|since|that)\b/i;
    const verbsCount = doc.verbs().length;

    if (verbsCount > 1) {
      const match = sentenceText.match(conjunctionRegex);
      if (match) {
        const conjunction = match[1];
        const parts = sentenceText.split(new RegExp(`\\b${conjunction}\\b`, 'i'));
        
        // We must only split if both left and right contain a verb
        if (parts.length === 2) {
          const leftDoc = nlp(parts[0]);
          const rightDoc = nlp(parts[1]);
          if (leftDoc.verbs().length > 0 && rightDoc.verbs().length > 0) {
            
            let leftPart = parts[0].trim();
            let rightPart = parts[1].trim();
            let conjunctionLower = conjunction.toLowerCase();

            // Phase 4: Embedded Relative Clauses
            if (conjunctionLower === 'that') {
              const leftWords = leftPart.split(/\s+/);
              const wordBeforeThat = leftWords[leftWords.length - 1];
              if (nlp(wordBeforeThat).has('#Noun')) {
                // Passivize the inner relative clause
                const innerResult = transformVoice(rightPart.replace(/[.,!?]$/, '').trim() + ' it');
                let innerText = innerResult.convertedText.replace(/^it\s+was\s+/i, 'were ').replace(/^it\s+is\s+/i, 'are ').replace(/^it\s+/i, 'were ').replace(/[.,!?]$/, '').trim();
                
                const leftResult = transformVoice(leftPart, { skipAST: true });
                let leftText = leftResult.convertedText.replace(/[.,!?]$/, '').trim();
                
                let finalConvertedText = leftText;
                if (leftResult.object && leftResult.object !== 'Compound') {
                  const escapedSubj = leftResult.object.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const subjRegex = new RegExp(`^${escapedSubj}`, 'i');
                  if (subjRegex.test(leftText)) {
                    finalConvertedText = leftText.replace(subjRegex, `$& that ${innerText}`) + '.';
                  } else {
                    finalConvertedText = `${leftText} that ${innerText}.`;
                  }
                } else {
                  finalConvertedText = `${leftText} that ${innerText}.`;
                }
                
                return {
                  type: 'voice',
                  originalVoice: 'Complex Sentence',
                  convertedVoice: 'Passive Voice',
                  convertedText: finalConvertedText,
                  subject: 'Compound', verb: 'Compound', object: 'Compound',
                  explanation: 'Passivized relative clause modifier along with main clause.',
                  exceptionsApplied: ['Relative Clause Modifier Exception']
                };
              }
            }

            // Special Handling: "that" Noun Clauses
            // If the conjunction is "that" and the left side has NO explicit object 
            // (e.g. "People say" or "The police suspected"), we simulate "it" as the object.
            // This forces the engine to output "It was said by people..."
            const reportingVerbs = ['say', 'believe', 'think', 'consider', 'know', 'report', 'understand', 'expect', 'suspect', 'tell', 'claim', 'admit', 'declare', 'state', 'feel'];
            const leftLastWord = leftPart.split(/\s+/).pop()?.toLowerCase() || '';
            const isLeftEndingInReportingVerb = reportingVerbs.some(v => getBaseForm(leftLastWord) === v || leftLastWord === v);
            
            if (conjunctionLower === 'that' && isLeftEndingInReportingVerb) {
              leftPart = leftPart + ' it';
            }

            // Phase 4: Subjunctive Mood
            const subjunctiveTriggers = ['insist', 'recommend', 'demand', 'suggest', 'request', 'propose', 'command', 'order'];
            const isSubjunctive = subjunctiveTriggers.some(v => getBaseForm(leftLastWord) === v || leftLastWord === v);

            const leftResult = transformVoice(leftPart);
            const rightResult = transformVoice(rightPart, { forceSubjunctive: isSubjunctive });

            let leftText = leftResult.convertedText.replace(/[.,!?]$/, '').trim();
            let rightText = rightResult.convertedText.trim();
            
            if (rightText.split(/\s+/)[0] !== 'I' && !nlp(rightText.split(/\s+/)[0]).has('#ProperNoun')) {
              rightText = rightText.charAt(0).toLowerCase() + rightText.slice(1);
            }
            let combinedText = `${capitalize(leftText)} ${conjunction.toLowerCase()} ${rightText}`;
            if (!combinedText.match(/[.,!?]$/)) combinedText += '.';

            return {
              type: 'voice',
              originalVoice: (leftResult.originalVoice as any) === (rightResult.originalVoice as any) ? leftResult.originalVoice : 'Unknown',
              convertedVoice: leftResult.convertedVoice === rightResult.convertedVoice ? leftResult.convertedVoice : 'Mixed Passive/Active',
              convertedText: combinedText,
              subject: 'Compound',
              verb: 'Compound',
              object: 'Compound',
              explanation: `Compound/Complex sentence split at '${conjunction}' and processed recursively. Left: ${leftResult.explanation} Right: ${rightResult.explanation}`,
              exceptionsApplied: [...(leftResult.exceptionsApplied || []), ...(rightResult.exceptionsApplied || []), `Recursive Clause Splitter Exception: Split on conjunction '${conjunction}'`]
            };
          }
      }
    }
  }
  }

  // --------------------------------------------------------------------
  // Exception Case A: Quasi-Passive Verbs (Sensory descriptions)
  // e.g. "Honey tastes sweet." / "The rose smells sweet." / "This cloth feels soft."
  // --------------------------------------------------------------------
  const quasiMatch = sentenceText.match(/^([a-z0-9\s]+?)\s+(tastes|smells|feels|sounds)\s+([a-z]+)[.,!?]?$/i);
  if (quasiMatch) {
    const subj = quasiMatch[1].trim();
    const sensoryVerb = quasiMatch[2].toLowerCase();
    const adj = quasiMatch[3].toLowerCase();

    const baseVerb = getBaseForm(sensoryVerb);
    const v3 = getPastParticiple(baseVerb);
    const isPlural = subj.toLowerCase().endsWith('s') || ['these', 'those'].includes(subj.toLowerCase());
    const aux = isPlural ? 'are' : 'is';
    const pronoun = isPlural ? 'they are' : 'it is';

    const convertedText = `${capitalize(subj)} ${aux} ${adj} when ${pronoun} ${v3}.`;
    exceptionsApplied.push('Quasi-Passive Verb Exception: Sensory structure transformed to "... when it is [V3]".');

    return {
      type: 'voice',
      originalVoice: 'Quasi-Passive',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: subj,
      verb: sensoryVerb,
      object: adj,
      explanation: 'Quasi-passive sensory construction transformed using "... is [adjective] when it is [past participle]".',
      exceptionsApplied
    };
  }

  // --------------------------------------------------------------------
  // Exception Case B: Infinitive Construction "It is time to [verb] [object]"
  // e.g. "It is time to close the shop." -> "It is time for the shop to be closed."
  // --------------------------------------------------------------------
  const timeInfinitiveMatch = sentenceText.match(/^it\s+is\s+time\s+to\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
  if (timeInfinitiveMatch) {
    const infVerb = timeInfinitiveMatch[1];
    const infObj = timeInfinitiveMatch[2];
    const v3 = getPastParticiple(getBaseForm(infVerb));

    const convertedText = `It is time for ${infObj.toLowerCase()} to be ${v3}.`;
    exceptionsApplied.push('Infinitive Time Exception: Transformed to "It is time for [object] to be [V3]".');

    return {
      type: 'voice',
      originalVoice: 'Active Voice',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: 'It',
      verb: infVerb,
      object: infObj,
      explanation: 'Infinitive sentence "It is time to..." transformed using "It is time for [object] to be [past participle]".',
      exceptionsApplied
    };
  }

  // --------------------------------------------------------------------
  // Exception Case C: Imperative Sentences
  // 1) "Let him do the work." -> "Let the work be done by him."
  // 2) "Shut the door." -> "Let the door be shut."
  // 3) "Please help me." -> "You are requested to help me."
  // 4) "Do not insult the poor." -> "Let not the poor be insulted."
  // --------------------------------------------------------------------
  const negImpMatch = sentenceText.match(/^(?:do\s+not|don't)\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
  if (negImpMatch) {
    const negVerb = negImpMatch[1];
    const negObj = negImpMatch[2];
    const v3 = getPastParticiple(getBaseForm(negVerb));

    const convertedText = `Let not ${negObj.toLowerCase()} be ${v3}.`;
    exceptionsApplied.push('Negative Imperative Exception: Transformed to "Let not [object] be [V3]".');

    return {
      type: 'voice',
      originalVoice: 'Imperative Sentence',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: 'Implied (You)',
      verb: `do not ${negVerb}`,
      object: negObj,
      explanation: 'Negative imperative transformed using "Let not [object] be [V3]".',
      exceptionsApplied
    };
  }

  const letActiveMatch = sentenceText.match(/^let\s+([a-z]+)\s+([a-z]+)\s+(.+?)[.,!?]?$/i);
  if (letActiveMatch) {
    const letAgent = letActiveMatch[1];
    const letVerb = letActiveMatch[2];
    const letObj = letActiveMatch[3];
    const v3 = getPastParticiple(getBaseForm(letVerb));

    const convertedText = `Let ${letObj.toLowerCase()} be ${v3} by ${toObjectPronoun(letAgent).toLowerCase()}.`;
    exceptionsApplied.push('Imperative "Let" Exception: Transformed active "Let" clause to passive.');

    return {
      type: 'voice',
      originalVoice: 'Imperative Sentence',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: letAgent,
      verb: letVerb,
      object: letObj,
      explanation: 'Imperative sentence starting with "Let" transformed to "Let [object] be [V3] by [agent]".',
      exceptionsApplied
    };
  }

  const isImperative = doc.has('#Imperative') || 
    /^(please|kindly)?\s*(close|open|bring|shut|do|help|give|clean|wash|take|write|turn|finish|respect|read)\b/i.test(sentenceText);
  
  if (isImperative) {
    let cleanImp = sentenceText.replace(/^(please|kindly)\s*,?\s*/i, '').replace(/[.,!?]$/, '');
    let wordsImp = cleanImp.split(' ');
    let verb = wordsImp[0];
    let object = wordsImp.slice(1).join(' ').trim();
    
    let isRequest = /^(please|kindly)/i.test(sentenceText);
    let isAdvice = /\b(elders|parents|teachers|truth|poor|country|laws|rules)\b/i.test(sentenceText);

    let convertedText = '';
    let explanation = '';
    const baseV = getBaseForm(verb);
    const v3Verb = getPastParticiple(baseV);

    if (isRequest) {
      convertedText = `You are requested to ${cleanImp.toLowerCase()}`;
      explanation = 'Transformed request imperative sentence to passive using "You are requested to...".';
      exceptionsApplied.push('Imperative Request Exception: Used "You are requested to..."');
    } else if (isAdvice && object) {
      convertedText = `${capitalize(object)} should be ${v3Verb}`;
      explanation = 'Transformed moral advice imperative sentence to passive using "... should be [V3]".';
      exceptionsApplied.push('Imperative Advice Exception: Used "... should be [V3]"');
    } else if (object) {
      convertedText = `Let ${object.toLowerCase()} be ${v3Verb}`;
      explanation = 'Transformed command imperative sentence to passive structure "Let + Object + be + V3".';
      exceptionsApplied.push('Imperative Command Exception: Used "Let + Object + be + V3"');
    } else {
      convertedText = `You are ordered to ${cleanImp.toLowerCase()}`;
      explanation = 'Transformed intransitive command sentence using "You are ordered to...".';
      exceptionsApplied.push('Imperative Intransitive Command Exception');
    }

    if (!convertedText.endsWith('.')) convertedText += '.';

    return {
      type: 'voice',
      originalVoice: 'Imperative Sentence',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: 'Implied (You)',
      verb,
      object: object || 'N/A',
      explanation,
      exceptionsApplied
    };
  }

  // --------------------------------------------------------------------
  // Exception Case D: Interrogative Sentences (Questions)
  // 1) "Who wrote this book?" -> "By whom was this book written?"
  // 2) "Whom did you invite?" -> "Who was invited by you?"
  // 3) "Does he write a letter?" -> "Is a letter written by him?"
  // --------------------------------------------------------------------
  const isQuestion = sentenceText.endsWith('?') || doc.sentences().isQuestion().found;
  if (isQuestion) {
    const whoMatch = sentenceText.match(/^who\s+([a-z]+)\s+(.+?)\??$/i);
    if (whoMatch) {
      const qVerb = whoMatch[1];
      const qObj = whoMatch[2];
      const baseV = getBaseForm(qVerb);
      const v3 = getPastParticiple(baseV);
      const aux = doc.has('#PastTense') || getSimplePast(baseV) === qVerb.toLowerCase() ? 'was' : 'is';

      const convertedText = `By whom ${aux} ${qObj.toLowerCase()} ${v3}?`;
      exceptionsApplied.push('Interrogative "Who" Exception: Transformed to "By whom [aux] [object] [V3]?"');

      return {
        type: 'voice',
        originalVoice: 'Interrogative Sentence',
        convertedVoice: 'Passive Voice',
        convertedText,
        subject: 'Who',
        verb: qVerb,
        object: qObj,
        explanation: 'Interrogative sentence starting with "Who" transformed to "By whom [auxiliary] [object] [past participle]?".',
        exceptionsApplied
      };
    }

    const whomMatch = sentenceText.match(/^whom\s+(did|does|do)\s+([a-z]+)\s+([a-z]+)(?:\s+([a-z]+))?\??$/i);
    if (whomMatch) {
      const qAux = whomMatch[1].toLowerCase();
      const qSubj = whomMatch[2];
      const qVerb = whomMatch[3];
      const qPrep = whomMatch[4] ? ` ${whomMatch[4]}` : '';
      const v3 = getPastParticiple(getBaseForm(qVerb));
      const aux = qAux === 'did' ? 'was' : 'is';

      const convertedText = `Who ${aux} ${v3}${qPrep} by ${toObjectPronoun(qSubj).toLowerCase()}?`;
      exceptionsApplied.push('Interrogative "Whom" Exception: Transformed to "Who [aux] [V3] by [subject]?"');

      return {
        type: 'voice',
        originalVoice: 'Interrogative Sentence',
        convertedVoice: 'Passive Voice',
        convertedText,
        subject: qSubj,
        verb: qVerb,
        object: 'Whom',
        explanation: 'Interrogative sentence starting with "Whom" transformed to "Who [auxiliary] [past participle] by [subject]?".',
        exceptionsApplied
      };
    }

    const doDoesDidMatch = sentenceText.match(/^(do|does|did)\s+([a-z]+)\s+([a-z]+)\s+(.+?)\??$/i);
    if (doDoesDidMatch) {
      const qAux = doDoesDidMatch[1].toLowerCase();
      const qSubj = doDoesDidMatch[2];
      const qVerb = doDoesDidMatch[3];
      const qObj = doDoesDidMatch[4];
      const v3 = getPastParticiple(getBaseForm(qVerb));

      const isPlural = qObj.toLowerCase().endsWith('s');
      let aux = 'is';
      if (qAux === 'did') aux = isPlural ? 'were' : 'was';
      else aux = isPlural ? 'are' : 'is';

      const convertedText = `${capitalize(aux)} ${qObj.toLowerCase()} ${v3} by ${toObjectPronoun(qSubj).toLowerCase()}?`;
      exceptionsApplied.push('Interrogative "Do/Does/Did" Exception: Transformed question structure.');

      return {
        type: 'voice',
        originalVoice: 'Interrogative Sentence',
        convertedVoice: 'Passive Voice',
        convertedText,
        subject: qSubj,
        verb: qVerb,
        object: qObj,
        explanation: 'Interrogative question starting with Do/Does/Did transformed to passive question structure.',
        exceptionsApplied
      };
    }
  }
    
  // --------------------------------------------------------------------
  // Phase 4: Extreme Edge Cases & Advanced Grammar Rules
  // --------------------------------------------------------------------

  // Phase 4: Negative Interrogative Imperatives (Why not...)
  const whyNotMatch = sentenceText.match(/^Why\s+not\s+([a-z]+)\s+(.+)\?$/i);
  if (whyNotMatch) {
      const v = whyNotMatch[1];
      const obj = whyNotMatch[2];
      const v3 = getPastParticiple(getBaseForm(v));
      return {
        type: 'voice', originalVoice: 'Active Voice', convertedVoice: 'Passive Voice',
        convertedText: `Why should ${obj.toLowerCase()} not be ${v3}?`,
        subject: 'Implied (You)', verb: v, object: obj,
        explanation: 'Negative interrogative imperative converted using should.',
        exceptionsApplied: [...exceptionsApplied, 'Negative Interrogative Imperative']
      };
    }

  // Phase 4: Emphatic Inversion (Not a word did he speak)
  const inversionMatch = sentenceText.match(/^Not\s+a\s+(word|thing|sound)\s+did\s+(he|she|they|I|we|you)\s+([a-z]+)[.,!?]?$/i);
  if (inversionMatch) {
      const noun = inversionMatch[1];
      const agent = inversionMatch[2];
      const v = inversionMatch[3];
      const v3 = getPastParticiple(getBaseForm(v));
      return {
        type: 'voice', originalVoice: 'Active Voice', convertedVoice: 'Passive Voice',
        convertedText: `Not a ${noun} was ${v3} by ${toObjectPronoun(agent)}.`,
        subject: agent, verb: v, object: noun,
        explanation: 'Emphatic inversion preserved in passive structure.',
        exceptionsApplied: [...exceptionsApplied, 'Emphatic Inversion Exception']
      };
    }

    // Phase 4: Embedded Gerunds (I like people praising me)
    const gerundEmbedMatch = sentenceText.match(/^(I|We|They|He|She|You)\s+(like|love|hate|enjoy|dislike)\s+(people|everyone|someone|somebody|anyone|them|him|her)\s+([a-z]+ing)\s+(me|us|you|him|her|it|them)$/i);
    if (gerundEmbedMatch) {
      const subj1 = gerundEmbedMatch[1];
      const verb1 = gerundEmbedMatch[2];
      const gerund = gerundEmbedMatch[4];
      const v3 = getPastParticiple(getBaseForm(gerund));
      return {
        type: 'voice', originalVoice: 'Active Voice', convertedVoice: 'Passive Voice',
        convertedText: `${subj1} ${verb1} being ${v3}.`,
        subject: subj1, verb: verb1, object: gerundEmbedMatch[5],
        explanation: 'Embedded relative clause gerund passivized internally.',
        exceptionsApplied: [...exceptionsApplied, 'Embedded Gerund Exception']
      };
    }

    // Phase 4: Complex Infinitive Chains (expect someone to do something)
    const infinitiveChainMatch = sentenceText.match(/^(I|We|He|She|They|You)\s+(did not expect|expected|want|wanted|would like|wish)\s+(anyone|someone|everybody|nobody|people|them|him|her)\s+to\s+([a-z]+)\s+(out\s+)?(.+)$/i);
    if (infinitiveChainMatch) {
      const subj1 = infinitiveChainMatch[1];
      const verb1 = infinitiveChainMatch[2];
      const innerVerb = infinitiveChainMatch[4];
      const particle = infinitiveChainMatch[5] || '';
      const obj = infinitiveChainMatch[6].replace(/[.,!?]$/, '').trim();
      const v3 = getPastParticiple(getBaseForm(innerVerb));
      return {
        type: 'voice', originalVoice: 'Active Voice', convertedVoice: 'Passive Voice',
        convertedText: `${subj1} ${verb1} ${obj} to be ${v3} ${particle}`.trim() + '.',
        subject: subj1, verb: verb1, object: obj,
        explanation: 'Complex infinitive chain with double object shifted to passive infinitive.',
        exceptionsApplied: [...exceptionsApplied, 'Complex Infinitive Chain Exception']
      };
    }

  // --------------------------------------------------------------------
  // Check 2: Passive Voice Detection
  // --------------------------------------------------------------------
  const passivePatternMatch = sentenceText.match(/\b(is|am|are|was|were|been|being|be)\s+([a-z]+ed|[a-z]+en|done|seen|made|taken|given|written|known|caught|bought|taught|built|drunk|drawn|eaten|flown|forgotten|forgiven|frozen|gotten|gone|grown|heard|hidden|held|kept|led|left|paid|put|read|ridden|rung|risen|run|said|sold|sent|shaken|sung|sunk|sat|slept|spoken|spent|stood|stolen|swum|thought|thrown|understood|worn|won|married|surprised|satisfied|pleased|displeased|contained|included|covered|filled|astonished|amazed|shut|cut|hit|hurt|cost|spread|split|quit|cast|broadcast|shed|burst)\b(?:\s+(by|to|with|in|at)\s+([a-zA-Z0-9\s]+))?/i);

  const isPassive = !!passivePatternMatch || sentenceText.includes(' by ') || sentenceText.includes(' known to ');

  // --------------------------------------------------------------------
  // PASSIVE -> ACTIVE TRANSFORMATION
  // --------------------------------------------------------------------
  if (isPassive) {
    let aux = passivePatternMatch ? passivePatternMatch[1].toLowerCase() : 'was';
    let participle = passivePatternMatch ? passivePatternMatch[2].toLowerCase() : 'done';
    let prep = 'by';
    let agentRaw = '';
    let remainder = '';

    const lowerSent = sentenceText.toLowerCase();
    const byIndex = lowerSent.lastIndexOf(' by ');
    
    // Some verbs have special prepositions instead of 'by'
    let specialPrep = '';
    for (const [v, p] of Object.entries(PREPOSITION_EXCEPTIONS)) {
      if (participle.includes(v) || getBaseForm(participle) === v) {
        specialPrep = ` ${p} `;
        break;
      }
    }

    const agentPrepIndex = byIndex !== -1 ? byIndex : (specialPrep ? lowerSent.lastIndexOf(specialPrep) : -1);

    if (agentPrepIndex !== -1) {
      prep = byIndex !== -1 ? 'by' : specialPrep.trim();
      const afterPrep = sentenceText.substring(agentPrepIndex + prep.length + 2).replace(/[.,!?]$/, '').trim();
      const afterWords = afterPrep.split(/\s+/);
      const firstWordObj = afterWords[0].toLowerCase();
      const objWords = afterWords;

      if (['me', 'him', 'her', 'us', 'them', 'you', 'it', 'whom'].includes(firstWordObj)) {
        agentRaw = afterWords[0];
        remainder = afterWords.slice(1).join(' ');
      } else if (['my', 'his', 'her', 'our', 'their', 'your'].includes(firstWordObj) && objWords.length >= 2) {
        agentRaw = objWords.slice(0, 2).join(' ');
        remainder = objWords.slice(2).join(' ');
      } else if (['this', 'that', 'these', 'those', 'the', 'a', 'an'].includes(firstWordObj) && objWords.length >= 2) {
        agentRaw = objWords.slice(0, 2).join(' ');
        remainder = objWords.slice(2).join(' ');
      } else {
        agentRaw = afterWords[0];
        remainder = afterWords.slice(1).join(' ');
      }

      const verbMatchIdx = lowerSent.indexOf(participle);
      if (verbMatchIdx !== -1 && verbMatchIdx + participle.length < agentPrepIndex) {
        const middleRemainder = sentenceText.substring(verbMatchIdx + participle.length, agentPrepIndex).trim();
        if (middleRemainder) {
          remainder = middleRemainder + (remainder ? ' ' + remainder : '');
        }
      }
    } else {
      const verbMatchIdx = lowerSent.indexOf(participle);
      if (verbMatchIdx !== -1) {
        remainder = sentenceText.substring(verbMatchIdx + participle.length).replace(/[.,!?]$/, '').trim();
      }
    }

    const frontParts = sentenceText.split(new RegExp(`\\b(${aux})\\b`, 'i'));
    let passiveSubject = frontParts[0] ? frontParts[0].trim() : 'the object';

    let activeSubject = 'Someone';
    if (agentRaw) {
      activeSubject = toSubjectPronoun(agentRaw);
      if (prep !== 'by') {
        exceptionsApplied.push(`Special Preposition Passive Exception: Identified agent preposition '${prep}'`);
      }
    } else {
      if (/\b(arrested|caught)\b/i.test(sentenceText)) activeSubject = 'The police';
      else if (/\b(spoken|used|known)\b/i.test(sentenceText)) activeSubject = 'People';
      else if (/\b(built|constructed)\b/i.test(sentenceText)) activeSubject = 'Workers';
      exceptionsApplied.push(`Agentless Passive Exception: Inferred default active agent '${activeSubject}'`);
    }

    let activeObject = toObjectPronoun(passiveSubject);
    if (activeObject.toLowerCase() !== passiveSubject.toLowerCase()) {
      exceptionsApplied.push(`Pronoun Case Shift Exception: Converted subjective '${passiveSubject}' to objective '${activeObject}'`);
    }

    let baseVerb = getBaseForm(participle);
    
    // Special handling: "allowed to [V1]" in passive -> "let [obj] [V1]" in active
    if (baseVerb === 'allow' && remainder.toLowerCase().startsWith('to ')) {
      baseVerb = 'let';
      remainder = remainder.substring(3).trim();
      exceptionsApplied.push('Causative Allowed Exception: Converted "allowed to" back to "let" with bare infinitive.');
    }
    
    let activeVerb = baseVerb;

    if (sentenceText.includes(' being ')) {
      const activeAux = ['he', 'she', 'it', 'someone', 'the police'].includes(activeSubject.toLowerCase()) ? 
        (aux === 'was' || aux === 'were' ? 'was' : 'is') : 
        (aux === 'was' || aux === 'were' ? 'were' : 'are');
      let ingVerb = baseVerb.endsWith('e') ? `${baseVerb.slice(0, -1)}ing` : `${baseVerb}ing`;
      activeVerb = `${activeAux} ${ingVerb}`;
    } else if (sentenceText.includes(' been ')) {
      const hasHave = ['i', 'you', 'we', 'they', 'people', 'workers'].includes(activeSubject.toLowerCase()) ? 'have' : 'has';
      const activeAux = aux === 'had' ? 'had' : hasHave;
      activeVerb = `${activeAux} ${participle}`;
    } else if (aux === 'was' || aux === 'were') {
      activeVerb = getSimplePast(baseVerb);
    } else if (aux === 'is' || aux === 'are' || aux === 'am') {
      const isSingular = ['he', 'she', 'it', 'someone', 'the police'].includes(activeSubject.toLowerCase());
      if (isSingular) {
        if (baseVerb.endsWith('y') && !/[aeiou]y$/.test(baseVerb)) activeVerb = `${baseVerb.slice(0, -1)}ies`;
        else if (/[s|x|z|ch|sh]$/.test(baseVerb)) activeVerb = `${baseVerb}es`;
        else activeVerb = `${baseVerb}s`;
      } else {
        activeVerb = baseVerb;
      }
    } else if (aux === 'be') {
      const modalMatch = sentenceText.match(/\b(will|shall|can|could|may|might|must|should|would)\s+be\b/i);
      const modal = modalMatch ? modalMatch[1] : 'will';
      activeVerb = `${modal} ${baseVerb}`;
    }

    let convertedText = `${capitalize(activeSubject)} ${activeVerb} ${activeObject.toLowerCase()}${remainder ? ' ' + remainder : ''}`;
    if (!convertedText.endsWith('.')) convertedText += '.';

    return {
      type: 'voice',
      originalVoice: 'Passive Voice',
      convertedVoice: 'Active Voice',
      convertedText,
      subject: activeSubject,
      verb: activeVerb,
      object: activeObject,
      explanation: 'Transformed from Passive Voice to Active Voice (emphasizing the doer/agent performing the action directly).',
      exceptionsApplied,
      tense: 'Passive Tense Form'
    };
  }

  // --------------------------------------------------------------------
  // ACTIVE -> PASSIVE TRANSFORMATION
  // --------------------------------------------------------------------

  const verbMatch = doc.verbs().first();
  const verbText = verbMatch.text() || '';
  
  const modalAuxiliaries = new Set(['will', 'shall', 'can', 'could', 'may', 'might', 'must', 'should', 'would', 'is', 'am', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did']);
  const verbWords = verbText.split(' ');
  let mainVerb = verbWords[0] || '';
  for (let i = 0; i < verbWords.length; i++) {
    if (!modalAuxiliaries.has(verbWords[i].toLowerCase())) {
      mainVerb = verbWords[i];
      break;
    }
  }
  // Fallback to the last word if it's all auxiliaries (rare)
  if (!mainVerb && verbWords.length > 0) mainVerb = verbWords[verbWords.length - 1];

  // Extract Active Subject & Object safely
  const words = sentenceText.replace(/[.,!?]$/, '').split(/\s+/);
  const mainVerbIdx = words.findIndex(w => getBaseForm(w) === getBaseForm(mainVerb) || w.toLowerCase() === mainVerb.toLowerCase());
  
  const firstVerbWord = verbWords[0] || mainVerb;
  const firstVerbIdx = words.findIndex(w => getBaseForm(w) === getBaseForm(firstVerbWord) || w.toLowerCase() === firstVerbWord.toLowerCase());

  let rawSubject = '';
  let rawObject = '';
  let phrasalParticle = '';

  if (mainVerbIdx >= 0 && mainVerbIdx < words.length - 1) {
    rawSubject = words.slice(0, firstVerbIdx !== -1 ? firstVerbIdx : mainVerbIdx).join(' ');
    
    // Check if next words form a 3-word or 2-word phrasal verb (e.g. "take care of", "look into")
    const nextWords = words.slice(mainVerbIdx + 1, mainVerbIdx + 3).map(w => w.toLowerCase());
    const candidate3Word = nextWords.length === 2 ? `${getBaseForm(mainVerb)} ${nextWords[0]} ${nextWords[1]}` : '';
    const candidate2Word = nextWords.length >= 1 ? `${getBaseForm(mainVerb)} ${nextWords[0]}` : '';

    if (candidate3Word && PREPOSITIONAL_VERBS.has(candidate3Word) && mainVerbIdx + 3 < words.length) {
      phrasalParticle = `${nextWords[0]} ${nextWords[1]}`;
      rawObject = words.slice(mainVerbIdx + 3).join(' ');
      exceptionsApplied.push(`3-Word Phrasal Verb Exception: Preserved particle '${phrasalParticle}' with verb`);
    } else if (candidate2Word && PREPOSITIONAL_VERBS.has(candidate2Word) && mainVerbIdx + 2 < words.length) {
      phrasalParticle = nextWords[0];
      rawObject = words.slice(mainVerbIdx + 2).join(' ');
      exceptionsApplied.push(`Phrasal Verb Exception: Preserved particle '${phrasalParticle}' with verb`);
    } else {
      rawObject = words.slice(mainVerbIdx + 1).join(' ');
    }
  }
  // Cognate Object Check
  const cognatePairs: Record<string, string[]> = {
    'die': ['death'],
    'live': ['life'],
    'sleep': ['sleep'],
    'dream': ['dream'],
    'sing': ['song'],
    'fight': ['fight'],
    'smile': ['smile'],
    'laugh': ['laugh'],
    'sigh': ['sigh']
  };
  const isCognateObject = Object.keys(cognatePairs).some(verb => 
    getBaseForm(mainVerb) === verb && 
    cognatePairs[verb].some(cog => rawObject.toLowerCase().includes(cog))
  );

  if (isIntransitiveVerb(mainVerb) && !phrasalParticle && !doc.has('#Object') && !isCognateObject) {
    return {
      type: 'voice',
      originalVoice: 'Intransitive (No Voice Change)',
      convertedVoice: 'N/A',
      convertedText: sentenceText,
      subject: doc.nouns().first().text() || 'Subject',
      verb: mainVerb,
      object: 'None (Intransitive Verb)',
      explanation: `Cannot convert sentence to passive voice because the verb "${mainVerb}" is intransitive (it takes no direct object to become the passive subject).`,
      exceptionsApplied: ['Intransitive Verb Exception: Voice transformation restricted.']
    };
  }

  if (!rawSubject) {
    const docAny = doc as any;
    rawSubject = (docAny.subjects && typeof docAny.subjects === 'function')
      ? docAny.subjects().first().text()
      : (doc.nouns().before(verbText).first().text() || doc.pronouns().before(verbText).first().text() || doc.nouns().first().text() || 'They');
  }

  if (!rawObject) {
    const docAny = doc as any;
    const afterVerbTerm = doc.after(verbText).first().text().replace(/[^a-zA-Z]/g, '').trim();
    rawObject = (docAny.objects && typeof docAny.objects === 'function')
      ? docAny.objects().first().text()
      : (doc.nouns().after(verbText).first().text() || doc.pronouns().after(verbText).first().text() || afterVerbTerm || 'the object');
  }

  if (!rawObject || rawObject === rawSubject) {
    return {
      type: 'voice',
      originalVoice: 'Intransitive (No Voice Change)',
      convertedVoice: 'N/A',
      convertedText: sentenceText,
      subject: rawSubject,
      verb: mainVerb,
      object: 'None',
      explanation: `Sentence lacks a distinct direct object to act as the subject of passive voice.`,
      exceptionsApplied: ['Missing Object Exception']
    };
  }

  // Obligation Infinitive: "I have a lot of work to do."
  const obligationMatch = sentenceText.match(/^([a-zA-Z]+)\s+(have|has|had)\s+(.+?)\s+to\s+([a-z]+)[.,!?]?$/i);
  if (obligationMatch) {
    const oblSubj = obligationMatch[1];
    const oblAux = obligationMatch[2];
    const oblObj = obligationMatch[3];
    const oblVerb = obligationMatch[4];
    const oblV3 = getPastParticiple(getBaseForm(oblVerb));

    const convertedText = `${capitalize(oblSubj)} ${oblAux} ${oblObj} to be ${oblV3}.`;
    exceptionsApplied.push('Obligation Infinitive Exception: Transformed "to [V1]" to "to be [V3]".');

    return {
      type: 'voice',
      originalVoice: 'Active Voice',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: oblSubj,
      verb: `${oblAux} ... to be ${oblV3}`,
      object: oblObj,
      explanation: 'Sentence with obligation infinitive transformed to passive infinitive structure.',
      exceptionsApplied,
      tense: 'Infinitive Form'
    };
  }

  // Gerund Phrase Passivization: "I remember my grandfather taking me to the zoo."
  const gerundMatch = sentenceText.match(/^([a-zA-Z]+)\s+(remember|like|hate|enjoy|dislike)\s+(.+?)\s+([a-z]+ing)\s+(me|him|her|us|them|you)(.*)[.,!?]?$/i);
  if (gerundMatch) {
    const mainSubj = gerundMatch[1];
    const mainVerb = gerundMatch[2];
    const gerundAgent = gerundMatch[3];
    const gerundVerb = gerundMatch[4];
    const gerundObj = gerundMatch[5];
    const rest = gerundMatch[6].replace(/[.,!?]+$/, '');

    if (mainSubj.toLowerCase() === toSubjectPronoun(gerundObj).toLowerCase()) {
      const baseGV = getBaseForm(gerundVerb);
      const v3GV = getPastParticiple(baseGV);
      const convertedText = `${capitalize(mainSubj)} ${mainVerb} being ${v3GV}${rest} by ${gerundAgent}.`;
      exceptionsApplied.push('Gerund Phrase Exception: Passivized V-ing into "being [V3]".');
      
      return {
        type: 'voice',
        originalVoice: 'Active Voice',
        convertedVoice: 'Passive Voice',
        convertedText,
        subject: mainSubj,
        verb: `${mainVerb} being ${v3GV}`,
        object: gerundObj,
        explanation: 'Active gerund phrase transformed to passive gerund phrase.',
        exceptionsApplied,
        tense: 'Gerund Form'
      };
    }
  }

  // Complex Sentence: "People say that he is a genius."
  const complexVerbs = new Set(['say', 'believe', 'know', 'think', 'report', 'consider', 'expect', 'feel', 'understand', 'find', 'suspect']);
  if (complexVerbs.has(getBaseForm(mainVerb)) && rawObject.toLowerCase().startsWith('that ')) {
    const baseComplex = getBaseForm(mainVerb);
    const v3 = getPastParticiple(baseComplex);
    const isPastComplex = /ed$|said|thought|knew|felt|found|told|heard/i.test(mainVerb);
    // We do a strict check for present tense verbs since 'believe' is sometimes mis-tagged
    const isPresent = /s$|believe|say|think|know|expect|feel|understand/i.test(mainVerb);
    const aux = (isPastComplex && !isPresent) ? 'was' : 'is';
    
    console.log(`DEBUG: mainVerb='${mainVerb}', isPastComplex=${isPastComplex}, isPresent=${isPresent}, aux='${aux}'`);
    
    const convertedText = `It ${aux} ${v3} ${rawObject}.`;
    exceptionsApplied.push('Complex Sentence Exception: Transformed to "It [aux] [V3] that..."');
    
    return {
      type: 'voice',
      originalVoice: 'Active Voice',
      convertedVoice: 'Passive Voice',
      convertedText,
      subject: 'It',
      verb: `${aux} ${v3}`,
      object: rawObject,
      explanation: 'Complex sentence with that-clause transformed to impersonal passive structure.',
      exceptionsApplied,
      tense: 'Passive Form'
    };
  }

  // Split rawObject into realObject and complement
  let realObject = rawObject;
  let complement = '';
  let adjuncts = '';

  // --------------------------------------------------------------------
  // 8. Extract Trailing Adjuncts (Time/Place/Reason clauses)
  // --------------------------------------------------------------------
  const adjunctRegex = /\b(yesterday|today|tomorrow|in the morning|at night|in the evening|on sunday|on monday|in \d{4}|next year|last year|next month|last month|next week|last week|last night|always|often|never|soon|later|now|then)$/i;
  const adjunctMatch = rawObject.match(adjunctRegex);
  if (adjunctMatch) {
    adjuncts = adjunctMatch[0];
    rawObject = rawObject.substring(0, rawObject.length - adjuncts.length).trim();
    realObject = rawObject;
    exceptionsApplied.push('Adjunct Separation Exception: Preserved time/place adjunct at the end of sentence.');
  }

  const asComplementMatch = rawObject.match(/^(.*?)\s+(as\s+.+)$/i);
  if (asComplementMatch) {
    rawObject = asComplementMatch[1].trim();
    complement = asComplementMatch[2].trim();
    realObject = rawObject;
    exceptionsApplied.push('Objective Complement Exception: Extracted "as" complement to remainder.');
  }

  const objWords = rawObject.split(' ');
  const firstWordObj = objWords[0].toLowerCase();
  const ditransitiveVerbs = new Set([
    'give', 'hand', 'send', 'show', 'offer', 'pay', 'teach', 'promise', 
    'lend', 'bring', 'buy', 'write', 'award', 'grant', 'leave', 'make',
    'let', 'bid', 'help', 'see', 'hear', 'watch', 'observe', 'feel',
    'appoint', 'elect', 'crown', 'name', 'declare'
  ]);
  
  const reflexivePronouns = new Set(['myself', 'himself', 'herself', 'itself', 'yourself', 'yourselves', 'ourselves', 'themselves']);
  
  if (reflexivePronouns.has(firstWordObj)) {
    realObject = objWords[0];
    complement = objWords.slice(1).join(' ');
    exceptionsApplied.push('Reflexive Pronoun Exception: Reflexive object retains subject identity.');
  } else if (['me', 'him', 'us', 'them', 'you'].includes(firstWordObj) && objWords.length > 1) {
    realObject = objWords[0];
    complement = objWords.slice(1).join(' ');
    exceptionsApplied.push('Double Object / Complement Exception: Promoted first object pronoun to subject.');
  } else if (firstWordObj === 'her' && objWords.length > 1) {
    // 'her' can be objective ("gave her a present") or possessive ("adorned her neck").
    // We check if the next word is a determiner or preposition to guess if it's objective.
    const compVerbs = new Set(['appoint', 'elect', 'crown', 'name', 'declare', 'make']);
    if (compVerbs.has(getBaseForm(mainVerb)) || ['a', 'an', 'the', 'some', 'to', 'for', 'in', 'on', 'at', 'with', 'from'].includes(objWords[1].toLowerCase())) {
      realObject = objWords[0];
      complement = objWords.slice(1).join(' ');
      exceptionsApplied.push('Double Object / Complement Exception: Promoted first object pronoun to subject.');
    } else {
      realObject = objWords.slice(0, 2).join(' ');
      complement = objWords.slice(2).join(' ');
    }
  } else if (['my', 'his', 'our', 'their', 'your'].includes(firstWordObj) && objWords.length >= 2) {
    realObject = objWords.slice(0, 2).join(' ');
    complement = objWords.slice(2).join(' ');
  } else if (ditransitiveVerbs.has(getBaseForm(mainVerb)) && ['the', 'a', 'an', 'this', 'that', 'these', 'those'].includes(firstWordObj) && objWords.length > 2) {
    realObject = objWords.slice(0, 2).join(' ');
    complement = objWords.slice(2).join(' ');
    exceptionsApplied.push('Noun-Noun Ditransitive Exception: Promoted first noun phrase to subject.');
  } else if (ditransitiveVerbs.has(getBaseForm(mainVerb)) && objWords.length > 1) {
    // If it's a ditransitive verb, try to find a determiner mid-phrase to split the indirect/direct object
    const determiners = ['a', 'an', 'the', 'some', 'any', 'this', 'that', 'these', 'those', 'my', 'his', 'her', 'our', 'their', 'your'];
    let splitIdx = -1;
    for (let i = 1; i < objWords.length; i++) {
      if (determiners.includes(objWords[i].toLowerCase())) {
        splitIdx = i;
        break;
      }
    }
    
    if (splitIdx > 0) {
      realObject = objWords.slice(0, splitIdx).join(' ');
      complement = objWords.slice(splitIdx).join(' ');
      exceptionsApplied.push('Double Object Split Exception: Separated direct and indirect objects.');
    } else if (!objWords[1].toLowerCase().match(/^(to|for|in|on|at|with|by|from|as)$/)) {
      // Fallback: take the first word as the indirect object (e.g. "James a new job" where 'a' might have been caught, but if it was "James new jobs" it wouldn't)
      realObject = objWords[0];
      complement = objWords.slice(1).join(' ');
      exceptionsApplied.push('Double Object Fallback Exception: Assumed first word is the indirect object.');
    } else {
      realObject = rawObject;
      complement = '';
    }
  } else {
    realObject = rawObject;
    complement = '';
  }

  let passiveSubject = toSubjectPronoun(realObject);
  let passiveAgent = toObjectPronoun(rawSubject);

  if (reflexivePronouns.has(realObject.toLowerCase())) {
    passiveSubject = rawSubject;
    passiveAgent = realObject;
  } else {
    if (passiveSubject.toLowerCase() !== realObject.toLowerCase()) {
      exceptionsApplied.push(`Pronoun Shift: Objective '${realObject}' -> Subjective '${passiveSubject}'`);
    }
    if (passiveAgent.toLowerCase() !== rawSubject.toLowerCase()) {
      exceptionsApplied.push(`Pronoun Shift: Subjective '${rawSubject}' -> Objective '${passiveAgent}'`);
    }
  }

  const agentPreposition = getPassiveAgentPreposition(mainVerb);
  if (agentPreposition !== 'by') {
    exceptionsApplied.push(`Special Preposition Exception: Verb '${mainVerb}' takes '${agentPreposition}' instead of 'by'`);
  }

  const baseVerb = getBaseForm(mainVerb);
  let V3 = getPastParticiple(baseVerb);

  if (complement) {
    const causativeVerbs = new Set(['make', 'bid', 'help', 'see', 'hear']);
    const compFirstWord = complement.split(' ')[0].toLowerCase();
    
    // Note: 'let' does not take 'to' in passive! ("I was let go", not "I was let to go")
    if (causativeVerbs.has(baseVerb) && getBaseForm(compFirstWord) === compFirstWord && !complement.toLowerCase().startsWith('to ') && !compFirstWord.endsWith('ing')) {
      complement = `to ${complement}`;
      exceptionsApplied.push('Causative Verb Exception: Added "to" before bare infinitive in passive voice.');
    } else if (baseVerb === 'let' && getBaseForm(compFirstWord) === compFirstWord && !complement.toLowerCase().startsWith('to ')) {
      V3 = 'allowed';
      complement = `to ${complement}`;
      exceptionsApplied.push('Causative Let Exception: Transformed "let" to "allowed to" in passive.');
    }
  }

  let passiveAux = 'was';
  const irregularPluralNouns = ['children', 'people', 'men', 'women', 'feet', 'teeth', 'mice', 'geese', 'oxen', 'data', 'criteria', 'phenomena'];
  const lowerPassSubj = passiveSubject.toLowerCase();
  const isIrregularPlural = irregularPluralNouns.includes(lowerPassSubj) || irregularPluralNouns.some(p => lowerPassSubj.endsWith(' ' + p));
  const isPluralSubject = ['they', 'we', 'you', 'these', 'those'].includes(lowerPassSubj) || 
                          isIrregularPlural || 
                          (passiveSubject.endsWith('s') && !['james', 'charles', 'thomas', 'chris', 'lucas', 'marcus', 'boss', 'glass', 'class', 'mass'].includes(lowerPassSubj));
  
  if (options.forceSubjunctive) {
    passiveAux = 'be';
    exceptionsApplied.push('Subjunctive Mood Exception: Forced passive auxiliary to "be".');
  } else if (/\b(is|am|are)\s+[a-z]+ing\b/i.test(sentenceText)) {
    passiveAux = isPluralSubject ? 'are being' : (passiveSubject.toLowerCase() === 'i' ? 'am being' : 'is being');
  } else if (/\b(was|were)\s+[a-z]+ing\b/i.test(sentenceText)) {
    passiveAux = isPluralSubject ? 'were being' : 'was being';
  } else if (/\b(has|have)\b/i.test(sentenceText) && !/\bhad\b/i.test(sentenceText)) {
    passiveAux = isPluralSubject ? 'have been' : 'has been';
  } else if (/\bhad\b/i.test(sentenceText)) {
    passiveAux = 'had been';
  } else if (/\b(will|shall|can|could|may|might|must|should|would)\s+have\b/i.test(sentenceText)) {
    const modalMatch = sentenceText.match(/\b(will|shall|can|could|may|might|must|should|would)\b/i);
    const modal = modalMatch ? modalMatch[1] : 'will';
    passiveAux = `${modal} have been`;
  } else if (/\b(will|shall|can|could|may|might|must|should|would)\b/i.test(sentenceText)) {
    const modalMatch = sentenceText.match(/\b(will|shall|can|could|may|might|must|should|would)\b/i);
    const modal = modalMatch ? modalMatch[1] : 'will';
    passiveAux = `${modal} be`;
  } else if (doc.has('#PastTense') || /wrote|ate|drove|took|gave|saw|built|bought|made|did|went|ran|found|kept|left|fixed/i.test(sentenceText)) {
    passiveAux = isPluralSubject ? 'were' : 'was';
  } else if (doc.has('#PresentTense')) {
    // If the verb is uninflected (e.g. 'let', 'cut') and subject is 3rd person singular, it must be past tense.
    const is3rdPersonSingular = !['I', 'you', 'we', 'they'].includes(passiveAgent.toLowerCase()) && !passiveAgent.endsWith('s') && passiveAgent.toLowerCase() !== 'people' && passiveAgent.toLowerCase() !== 'men' && passiveAgent.toLowerCase() !== 'women';
    if (baseVerb === mainVerb.toLowerCase() && is3rdPersonSingular && getSimplePast(baseVerb) === baseVerb) {
      passiveAux = isPluralSubject ? 'were' : 'was';
    } else {
      passiveAux = isPluralSubject ? 'are' : (passiveSubject.toLowerCase() === 'i' ? 'am' : 'is');
    }
  }

  // Indefinite Agent Omission
  const vagueAgents = new Set(['one', 'someone', 'somebody', 'nobody', 'no one', 'people', 'they', 'them']);
  let agentPhrase = ` ${agentPreposition} ${passiveAgent.toLowerCase()}`;
  if (vagueAgents.has(rawSubject.toLowerCase())) {
    agentPhrase = '';
    exceptionsApplied.push('Indefinite Agent Exception: Omitted vague agent from passive sentence.');
  }

  // Also trim possessives in the passive subject if indefinite e.g. "one's promises" -> "promises"
  if (passiveSubject.toLowerCase().startsWith("one's ")) {
    passiveSubject = passiveSubject.substring(6);
    exceptionsApplied.push("Possessive Pronoun Exception: Trimmed indefinite possessive 'one's' from subject.");
  }

  const fullVerbPhrase = phrasalParticle ? `${V3} ${phrasalParticle}` : V3;
  let convertedText = `${capitalize(passiveSubject)} ${passiveAux} ${fullVerbPhrase}${complement ? ' ' + complement : ''}${agentPhrase}${adjuncts ? ' ' + adjuncts : ''}`;
  if (!convertedText.endsWith('.')) convertedText += '.';

  return {
    type: 'voice',
    originalVoice: 'Active Voice',
    convertedVoice: 'Passive Voice',
    convertedText,
    subject: rawSubject,
    verb: phrasalParticle ? `${mainVerb} ${phrasalParticle}` : mainVerb,
    object: realObject,
    explanation: 'Transformed from Active Voice to Passive Voice (emphasizing the recipient/target of the action).',
    exceptionsApplied,
    tense: 'Active Form'
  };
}
