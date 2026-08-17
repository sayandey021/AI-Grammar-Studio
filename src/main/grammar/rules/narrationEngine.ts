import nlp from 'compromise';
import { getBaseForm, getPastParticiple, getSimplePast } from './voiceEngine';

export interface NarrationResult {
  type: 'narration';
  originalSpeech: 'Direct Speech' | 'Indirect Speech';
  convertedSpeech: 'Indirect Speech' | 'Direct Speech';
  convertedText: string;
  reportingVerb: string;
  speaker: string;
  listener?: string;
  explanation: string;
  exceptionsApplied: string[];
}

// ─── Adverb Tables ────────────────────────────────────────────────────────────

const DIRECT_TO_INDIRECT_ADVERBS: [string, string][] = [
  ['next year',   'the following year'],
  ['next week',   'the following week'],
  ['next month',  'the following month'],
  ['last year',   'the previous year'],
  ['last week',   'the previous week'],
  ['last month',  'the previous month'],
  ['today',       'that day'],
  ['tomorrow',    'the next day'],
  ['yesterday',   'the previous day'],
  ['tonight',     'that night'],
  ['now',         'then'],
  ['here',        'there'],
  ['ago',         'before'],
];

const INDIRECT_TO_DIRECT_ADVERBS: [string, string][] = [
  ['the following year',  'next year'],
  ['the previous year',   'last year'],
  ['the following week',  'next week'],
  ['the previous week',   'last week'],
  ['the following month', 'next month'],
  ['the previous month',  'last month'],
  ['the next day',        'tomorrow'],
  ['the following day',   'tomorrow'],
  ['the previous day',    'yesterday'],
  ['the day before',      'yesterday'],
  ['that day',            'today'],
  ['that night',          'tonight'],
  ['then',                'now'],
  ['there',               'here'],
  ['before',              'ago'],
];

// ─── Universal Truth / Historical Fact ───────────────────────────────────────

const UNIVERSAL_TRUTHS = [
  /earth revolves/i, /sun rises/i, /sun sets/i,
  /honesty is the best policy/i, /water boils/i, /water freezes/i,
  /two and two make/i, /light travels/i, /god is/i,
  /planets revolve/i, /the earth is round/i,
];
const HISTORICAL_FACTS = [
  /became independent/i, /was born in/i, /died in/i,
  /world war/i, /french revolution/i, /quit india/i,
];

function isUniversalTruth(text: string): boolean {
  return UNIVERSAL_TRUTHS.some(r => r.test(text));
}
function isHistoricalFact(text: string): boolean {
  return HISTORICAL_FACTS.some(r => r.test(text));
}

// ─── Adverb Shift ─────────────────────────────────────────────────────────────

function shiftAdverbsDirectToIndirect(text: string, rules: string[]): string {
  let result = text;
  for (const [direct, indirect] of DIRECT_TO_INDIRECT_ADVERBS) {
    const regex = new RegExp(`\\b${direct.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, indirect);
      rules.push(`Shifted adverb: "${direct}" → "${indirect}"`);
    }
  }
  result = result.replace(/\bthis\b/gi, 'that').replace(/\bthese\b/gi, 'those');
  return result;
}

function shiftAdverbsIndirectToDirect(text: string, rules: string[]): string {
  let result = text;
  for (const [indirect, direct] of INDIRECT_TO_DIRECT_ADVERBS) {
    const regex = new RegExp(`\\b${indirect.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, direct);
      rules.push(`Restored adverb: "${indirect}" → "${direct}"`);
    }
  }
  return result;
}

// ─── Entity Context ───────────────────────────────────────────────────────────

interface EntityContext {
  person: '1st' | '2nd' | '3rd';
  gender: 'masculine' | 'feminine' | 'plural' | 'neuter';
}

function getEntityContext(name: string): EntityContext {
  // Handle multi-word names like "his mother" — check each word, LAST first (most specific)
  // Skip possessive pronouns ('his', 'her', 'their') so we don't misidentify the gender.
  const POSSESSIVES = new Set(['his','her','their','its','our','my','your']);
  const words = name.trim().toLowerCase().split(/\s+/).reverse();
  for (const lower of words) {
    if (POSSESSIVES.has(lower)) continue; // skip possessive determiners
    if (['i','me','my','mine','myself'].includes(lower))
      return { person: '1st', gender: 'masculine' };
    if (['we','us','our','ours','ourselves'].includes(lower))
      return { person: '1st', gender: 'plural' };
    if (['you','your','yours','yourself'].includes(lower))
      return { person: '2nd', gender: 'masculine' };
    if (['he','him','himself','john','david','boy','man','father','brother','son','king',
         'ram','rahim','robert','james','peter','tom','george','harry','jack','manager','philosopher',
         'traveler','traveller','mountaineer','husband','prince','lord','duke'].includes(lower))
      return { person: '3rd', gender: 'masculine' };
    if (['she','herself','mary','alice','girl','woman','mother','sister','daughter','queen',
         'sita','gita','emma','sarah','jane','lisa','anna','wife','aunt','grandmother','lady','princess',
         'nurse','actress','hostess'].includes(lower))
      return { person: '3rd', gender: 'feminine' };
    if (['they','them','theirs','themselves','people','children','students','friends',
         'players','workers','soldiers'].includes(lower))
      return { person: '3rd', gender: 'plural' };
  }
  return { person: '3rd', gender: 'masculine' };
}

// ─── Pronoun Replacement ──────────────────────────────────────────────────────

function replaceDirectPronouns(
  text: string,
  speaker: string,
  listener: string | undefined,
  rules: string[]
): string {
  const spkCtx = getEntityContext(speaker);
  const lstCtx = listener ? getEntityContext(listener) : { person: '3rd' as const, gender: 'plural' as const };

  let result = text;

  // 1st person singular → based on speaker gender
  if (spkCtx.gender === 'feminine') {
    result = result.replace(/\bI\b/g, 'she').replace(/\bme\b/gi, 'her')
                   .replace(/\bmy\b/gi, 'her').replace(/\bmine\b/gi, 'hers')
                   .replace(/\bmyself\b/gi, 'herself');
  } else if (spkCtx.gender === 'plural') {
    result = result.replace(/\bI\b/g, 'they').replace(/\bme\b/gi, 'them')
                   .replace(/\bmy\b/gi, 'their').replace(/\bmine\b/gi, 'theirs')
                   .replace(/\bmyself\b/gi, 'themselves');
  } else {
    result = result.replace(/\bI\b/g, 'he').replace(/\bme\b/gi, 'him')
                   .replace(/\bmy\b/gi, 'his').replace(/\bmine\b/gi, 'his')
                   .replace(/\bmyself\b/gi, 'himself');
  }

  // 1st person plural
  result = result.replace(/\bwe\b/gi, 'they').replace(/\bus\b/gi, 'them')
                 .replace(/\bour\b/gi, 'their').replace(/\bours\b/gi, 'theirs')
                 .replace(/\bourselves\b/gi, 'themselves');

  // 2nd person — split into tokens to handle subject vs object
  const prepositions = new Set([
    'to','for','by','with','from','of','about','at','in','on','into','onto',
    'upon','against','between','among','through','without','before','after',
    'since','until','than','as','towards','beside','behind','over','under',
  ]);
  const conjunctions = new Set(['and','or','but','if','that','when','while','because','so',
                                 'although','though','unless','since','as','which','who','whom','whose']);

  const tokens = result.split(/(\s+)/);
  for (let i = 0; i < tokens.length; i++) {
    const raw   = tokens[i];
    const word  = raw.replace(/[^a-zA-Z']/g, '').toLowerCase();
    if (word === 'you') {
      let prevWord = '';
      for (let j = i - 1; j >= 0; j--) {
        const t = tokens[j].trim().replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (t) { prevWord = t; break; }
      }
      const isObjPos = prepositions.has(prevWord) ||
                       (!conjunctions.has(prevWord) && prevWord !== '' && !prepositions.has(prevWord) === false);
      // Simpler rule: after preposition → object; otherwise → subject
      const afterPrep = prepositions.has(prevWord);

      if (afterPrep) {
        if (lstCtx.person === '1st') tokens[i] = raw.replace(/you/i, 'me');
        else if (lstCtx.gender === 'feminine') tokens[i] = raw.replace(/you/i, 'her');
        else if (lstCtx.gender === 'plural') tokens[i] = raw.replace(/you/i, 'them');
        else tokens[i] = raw.replace(/you/i, 'him');
      } else {
        if (lstCtx.person === '1st') tokens[i] = raw.replace(/you/i, 'I');
        else if (lstCtx.gender === 'feminine') tokens[i] = raw.replace(/you/i, 'she');
        else if (lstCtx.gender === 'plural') tokens[i] = raw.replace(/you/i, 'they');
        else tokens[i] = raw.replace(/you/i, 'he');
      }
    } else if (word === 'your') {
      if (lstCtx.person === '1st') tokens[i] = raw.replace(/your/i, 'my');
      else if (lstCtx.gender === 'feminine') tokens[i] = raw.replace(/your/i, 'her');
      else if (lstCtx.gender === 'plural') tokens[i] = raw.replace(/your/i, 'their');
      else tokens[i] = raw.replace(/your/i, 'his');
    } else if (word === 'yourself') {
      if (lstCtx.person === '1st') tokens[i] = raw.replace(/yourself/i, 'myself');
      else if (lstCtx.gender === 'feminine') tokens[i] = raw.replace(/yourself/i, 'herself');
      else if (lstCtx.gender === 'plural') tokens[i] = raw.replace(/yourself/i, 'themselves');
      else tokens[i] = raw.replace(/yourself/i, 'himself');
    }
  }
  result = tokens.join('');
  rules.push('Shifted 1st & 2nd person pronouns based on speaker/listener context.');
  return result;
}

// ─── Subject-Verb Agreement Fix ──────────────────────────────────────────────

function fixSubjectVerbAgreement(text: string): string {
  return text
    .replace(/\b(he|she|it)\s+am\b/gi, '$1 is')
    .replace(/\b(he|she|it)\s+are\b/gi, '$1 is')
    .replace(/\b(they|we)\s+is\b/gi, '$1 are')
    .replace(/\b(they|we)\s+am\b/gi, '$1 are')
    .replace(/\bI\s+is\b/gi, 'I am')
    .replace(/\bI\s+are\b/gi, 'I am')
    .replace(/\b(he|she|it)\s+have\b/gi, '$1 has')
    .replace(/\b(they|we|you|I)\s+has\b/gi, '$1 have');
}

// ─── Past Continuous → Past Perfect Continuous ───────────────────────────────

function backshiftPastContinuous(text: string, rules: string[]): string {
  const regex = /\b(was|were)\s+(\w+ing)\b/gi;
  if (!regex.test(text)) return text;
  const result = text.replace(/\b(was|were)\s+(\w+ing)\b/gi, 'had been $2');
  rules.push('Past Continuous → Past Perfect Continuous: "was/were + V-ing" → "had been + V-ing".');
  return result;
}

// ─── Embedded Clause Verb Backshift ──────────────────────────────────────────

const EMBEDDED_IRREGULAR: Record<string, string> = {
  takes:'took', makes:'made', comes:'came', goes:'went', gets:'got',
  runs:'ran', sees:'saw', says:'said', tells:'told', knows:'knew',
  thinks:'thought', feels:'felt', leaves:'left', brings:'brought',
  means:'meant', keeps:'kept', shows:'showed', finds:'found', gives:'gave',
  becomes:'became', take:'took', make:'made', come:'came', go:'went',
  get:'got', run:'ran', see:'saw', know:'knew', think:'thought',
  feel:'felt', leave:'left', bring:'brought', mean:'meant', keep:'kept',
  show:'showed', find:'found', give:'gave', become:'became',
};

const EMBEDDED_MARKERS = /\b(how|what|where|when|whether|which|who|whom|whose)\b/i;

function backshiftEmbeddedClauses(text: string, rules: string[]): string {
  if (!EMBEDDED_MARKERS.test(text)) return text;

  // Split around embedded clause markers (keep the marker in group)
  const parts = text.split(/(\b(?:how|what|where|when|whether|which|who|whom|whose)\b)/gi);
  const out: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      out.push(parts[i]); // main clause portion — untouched
    } else {
      out.push(parts[i]); // the marker
      i++;
      if (i < parts.length) {
        let sub = parts[i];
        // Apply irregular backshifts
        for (const [pres, past] of Object.entries(EMBEDDED_IRREGULAR)) {
          sub = sub.replace(new RegExp(`\\b${pres}\\b`, 'gi'), past);
        }
        // Apply aux backshifts
        sub = sub
          .replace(/\bhas been\b/gi, 'had been')
          .replace(/\bhave been\b/gi, 'had been')
          .replace(/\bhas\b/gi, 'had')
          .replace(/\bhave\b/gi, 'had')
          .replace(/\bis\b/gi, 'was')
          .replace(/\bare\b/gi, 'were')
          .replace(/\bam\b/gi, 'was')
          .replace(/\bwill\b/gi, 'would')
          .replace(/\bcan\b/gi, 'could')
          .replace(/\bmay\b/gi, 'might');
        out.push(sub);
        rules.push('Backshifted present-tense verbs in embedded wh-clause.');
      }
    }
  }
  return out.join('');
}

// ─── Main Tense Backshift ─────────────────────────────────────────────────────

function backshiftTense(text: string, rules: string[]): string {
  // Preserve universal truths
  if (isUniversalTruth(text)) {
    rules.push('Universal Truth Exception: Preserved present tense.');
    return text;
  }
  // Preserve historical facts
  if (isHistoricalFact(text)) {
    rules.push('Historical Fact Exception: Preserved tense.');
    return text;
  }
  // Type 2 conditional: "if ... had ... would" → tenses already correct
  if (/\bif\b/i.test(text) && /\bhad\b/i.test(text) && /\bwould\b/i.test(text)) {
    rules.push('Type 2 Conditional Exception: Tenses preserved ("had"/"would").');
    // Still run embedded clause backshift for nested clauses
    return backshiftEmbeddedClauses(text, rules);
  }
  // Type 3 conditional: "if ... had ... would have" → unchanged
  if (/\bif\b/i.test(text) && /\bhad\b/i.test(text) && /\bwould have\b/i.test(text)) {
    rules.push('Type 3 Conditional Exception: Tenses preserved.');
    return text;
  }

  let result = text;

  // ── 1. Past Continuous → Past Perfect Continuous ──
  result = backshiftPastContinuous(result, rules);

  // ── 2. Contraction backshifts (before other replacements to avoid partial matches) ──
  // couldn't / could not  →  hadn't been able to / had not been able to
  result = result.replace(/\bcouldn't\b/gi, "hadn't been able to");
  result = result.replace(/\bcould not\b/gi, 'had not been able to');

  // wouldn't → would not (would is unchanging, just expand)
  result = result.replace(/\bwouldn't\b/gi, 'would not');
  result = result.replace(/\bshouldn't\b/gi, 'should not');
  result = result.replace(/\bdon't\b/gi, "didn't");
  result = result.replace(/\bdoesn't\b/gi, "didn't");
  result = result.replace(/\bwon't\b/gi, "wouldn't");
  result = result.replace(/\bisn't\b/gi, "wasn't");
  result = result.replace(/\baren't\b/gi, "weren't");
  result = result.replace(/\bwasn't\b/gi, "hadn't been");
  result = result.replace(/\bweren't\b/gi, "hadn't been");

  // ── 3. Fix subjunctive leak before modal shifts ──
  result = result.replace(/\bI\s+were\b/gi, 'I was')
                 .replace(/\bhe\s+were\b/gi, 'he was')
                 .replace(/\bshe\s+were\b/gi, 'she was');

  // ── 4. Modal auxiliary backshifts ──
  const modalShifts: [RegExp, string][] = [
    [/\bam\b/gi,       'was'],
    [/\bis\b/gi,       'was'],
    [/\bare\b/gi,      'were'],
    [/\bhas been\b/gi, 'had been'],
    [/\bhave been\b/gi,'had been'],
    [/\bhas\b/gi,      'had'],
    [/\bhave\b/gi,     'had'],
    [/\bwill\b/gi,     'would'],
    [/\bshall\b/gi,    'should'],
    [/\bcan\b/gi,      'could'],
    [/\bmay\b/gi,      'might'],
    [/\bdo not\b/gi,   'did not'],
    [/\bdoes not\b/gi, 'did not'],
    [/\bdid not\b/gi,  'had not'],
    [/\bdidn't\b/gi,   "hadn't"],
  ];

  let shiftedAux = false;
  for (const [regex, rep] of modalShifts) {
    if (regex.test(result)) {
      result = result.replace(regex, rep);
      shiftedAux = true;
    }
  }

  // ── 5. "must" handling ──
  const isMoral   = /parents|elders|teachers|duty|respect|country|obey|law/i.test(result);
  const isFutNec  = /next year|next week|tomorrow|next month/i.test(result);
  if (/\bmust\b/i.test(result)) {
    if (isMoral) {
      rules.push('Moral Obligation Exception: "must" unchanged.');
    } else if (isFutNec) {
      result = result.replace(/\bmust\b/gi, 'would have to');
      shiftedAux = true;
      rules.push('"must" → "would have to" (future necessity).');
    } else {
      result = result.replace(/\bmust\b/gi, 'had to');
      shiftedAux = true;
    }
  }

  // ── 6. Mark unchanging modals so NLP fallback skips ──
  if (/\b(could|would|should|might|ought to|used to)\b/i.test(result)) {
    shiftedAux = true;
  }

  // ── 7. Fix subjunctive leak after modal shifts ──
  result = result.replace(/\bI\s+were\b/gi, 'I was')
                 .replace(/\bhe\s+were\b/gi, 'he was')
                 .replace(/\bshe\s+were\b/gi, 'she was');

  // ── 8. NLP-based fallback for remaining verbs ──
  if (!shiftedAux) {
    const doc   = nlp(result);
    const verbs = doc.verbs().out('array') as string[];
    if (verbs.length > 0) {
      const firstVerb = verbs[0];
      const base      = getBaseForm(firstVerb);
      const hasTimeCl = /\b(when|while|after)\b/i.test(result);

      if (hasTimeCl && firstVerb === getSimplePast(base)) {
        rules.push(`Time Clause Exception: Preserved past simple "${firstVerb}".`);
      } else if (firstVerb === base || firstVerb === `${base}s` || firstVerb === `${base}es`) {
        const past = getSimplePast(base);
        result = result.replace(new RegExp(`\\b${firstVerb}\\b`, 'i'), past);
        rules.push(`Backshifted "${firstVerb}" → "${past}".`);
      } else if (firstVerb === getSimplePast(base) && !result.includes('had ')) {
        const pp = getPastParticiple(base);
        result = result.replace(new RegExp(`\\b${firstVerb}\\b`, 'i'), `had ${pp}`);
        rules.push(`Backshifted "${firstVerb}" → "had ${pp}".`);
      }
    }
  } else {
    rules.push('Backshifted tense to corresponding past form.');
  }

  // ── 9. Backshift embedded sub-clause verbs (always, even when shiftedAux) ──
  result = backshiftEmbeddedClauses(result, rules);

  return result;
}

// ─── Exclamatory Transformation ───────────────────────────────────────────────

function transformExclamatory(
  quote: string,
  rules: string[]
): { verb: string; quote: string } {
  const raw = quote.replace(/!$/, '').trim();

  // Interjection-led exclamations
  if (/^(hurrah|hooray|yay)\b/i.test(raw)) {
    const rest = raw.replace(/^(hurrah|hooray|yay)[,!\s]*/i, '').trim();
    rules.push('"Hurrah/Hooray/Yay" → exclaimed with joy.');
    return { verb: 'exclaimed with joy', quote: rest || 'it was a joyful moment' };
  }
  if (/^(alas|oh no)\b/i.test(raw)) {
    const rest = raw.replace(/^(alas|oh no)[,!\s]*/i, '').trim();
    rules.push('"Alas/Oh no" → exclaimed with sorrow.');
    return { verb: 'exclaimed with sorrow', quote: rest || 'it was sorrowful' };
  }
  if (/^bravo\b/i.test(raw)) {
    const rest = raw.replace(/^bravo[,!\s]*/i, '').trim();
    rules.push('"Bravo" → exclaimed with appreciation.');
    return { verb: 'exclaimed with appreciation', quote: rest || 'it was well done' };
  }
  if (/^(pooh|ugh|yuck|eww)\b/i.test(raw)) {
    const rest = raw.replace(/^(pooh|ugh|yuck|eww)[,!\s]*/i, '').trim();
    rules.push('"Pooh/Ugh/Yuck" → exclaimed with disgust.');
    return { verb: 'exclaimed with disgust', quote: rest || 'it was disgusting' };
  }
  if (/^(wow|amazing|fantastic|wonderful)\b/i.test(raw)) {
    const rest = raw.replace(/^(wow|amazing|fantastic|wonderful)[,!\s]*/i, '').trim();
    rules.push('"Wow/Amazing" → exclaimed with joy.');
    return { verb: 'exclaimed with joy', quote: rest || 'it was wonderful' };
  }

  // "What a/an <rest>!" → "it was a very <rest>"
  const whatAMatch = raw.match(/^what\s+an?\s+(.*?)$/i);
  if (whatAMatch) {
    const rest = whatAMatch[1].trim();
    rules.push('"What a/an ..." exclamation → assertive "it was a very ...".');
    return { verb: 'exclaimed with joy', quote: `it was a very ${rest}` };
  }

  // "What <noun-pl / adj>!" (no article)
  const whatMatch = raw.match(/^what\s+([a-z].*)$/i);
  if (whatMatch) {
    const rest = whatMatch[1].trim();
    rules.push('"What ..." exclamation → assertive.');
    return { verb: 'exclaimed with joy', quote: `it was a very ${rest}` };
  }

  // "How <adj/adv> <rest>!"
  const howMatch = raw.match(/^how\s+(.*?)$/i);
  if (howMatch) {
    const rest = howMatch[1].trim();
    rules.push('"How ..." exclamation → assertive "it was very ...".');
    return { verb: 'exclaimed with joy', quote: `it was very ${rest}` };
  }

  // Generic fallback
  rules.push('Exclamatory sentence → exclaimed.');
  return { verb: 'exclaimed', quote: raw };
}

// ─── Question Word Order Inversion ────────────────────────────────────────────

function fixInterrogativeWordOrder(quote: string, rules: string[]): string {
  // Remove trailing ?
  let result = quote.replace(/\?$/, '').trim();

  // Invert: <aux> <subject> <rest> → <subject> <aux> <rest>
  const invPat = /^(are|is|am|was|were|do|does|did|will|would|can|could|shall|should|may|might)\s+([a-zA-Z']+)\s*(.*)/i;
  const m = result.match(invPat);
  if (m) {
    const aux  = m[1].toLowerCase(); // normalise case
    const subj = m[2];
    const rest = m[3];
    result = `${subj} ${aux} ${rest}`.trim();
    rules.push(`Question inversion: "${m[1]} ${subj}" → "${subj} ${aux}".`);
  }

  // Remove bare do/does helper that remains after inversion
  result = result.replace(/\bdo\s+(?!not\b)(?=\w)/gi, '').replace(/\bdoes\s+(?!not\b)(?=\w)/gi, '');

  return result;
}

// ─── Quote Extraction ────────────────────────────────────────────────────────

/**
 * Extracts { reportingClause, reportedClause } from a direct-speech sentence.
 * Handles both patterns:
 *   1. Reporting-before-quote: She said, "..."
 *   2. Quote-before-reporting: "..." she said.
 */
function extractDirectSpeechParts(text: string): { reportingClause: string; reportedClause: string } {
  // Normalise curly/smart quotes → straight quotes
  const normalised = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  // Pattern A: <reporting>, "<quote>" [optional trailing clause]
  // The quote may contain commas, so we match the LAST closing quote in the string.
  const patternA = /^(.*?)(?:,\s*|:\s*)?"(.*?)"[,.]?\s*(.*?)\s*$/;
  const mA = normalised.match(patternA);
  if (mA && mA[1].trim()) {
    return {
      reportingClause: mA[1].trim().replace(/[,:]\s*$/, '').trim(),
      // Strip any trailing comma/period that leaked inside the captured group
      reportedClause:  mA[2].trim().replace(/[,;]\s*$/, ''),
    };
  }

  // Pattern B: "<quote>" [,] <reporting clause>
  const patternB = /^"(.*?)"[,.]?\s*(.*?)\s*\.?\s*$/;
  const mB = normalised.match(patternB);
  if (mB && mB[2].trim()) {
    return {
      reportingClause: mB[2].trim(),
      reportedClause:  mB[1].trim().replace(/[,;]\s*$/, ''),
    };
  }

  // Fallback: strip all quotes
  return {
    reportingClause: 'He said',
    reportedClause:  normalised.replace(/["']/g, '').trim(),
  };
}

// ─── Parse Reporting Clause ──────────────────────────────────────────────────

function parseReportingClause(clause: string): {
  speaker: string; verb: string; listener?: string;
} {
  const verbPat = /said to|said|asked|told|exclaimed|replied|declared|prayed|advised|ordered|says|will say|has said/i;
  const m = clause.match(
    new RegExp(`^(.+?)\\s+(${verbPat.source})\\s*(.*)$`, 'i')
  );
  if (m) {
    return {
      speaker:  m[1].trim(),
      verb:     m[2].trim().toLowerCase(),
      listener: m[3].trim() || undefined,
    };
  }
  return { speaker: clause.trim() || 'He', verb: 'said' };
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function transformNarration(text: string): NarrationResult {
  const trimmed = text.trim();
  // Detect direct speech by presence of any quote character (including curly quotes)
  const isDirect = /[""\u201C\u201D\u2018\u2019'«»]/.test(trimmed);
  const exceptionsApplied: string[] = [];

  // ════════════════════════════════════════════════════════════════════════════
  // DIRECT → INDIRECT
  // ════════════════════════════════════════════════════════════════════════════
  if (isDirect) {
    const { reportingClause, reportedClause } = extractDirectSpeechParts(trimmed);

    const { speaker, verb: originalVerb, listener: parsedListener } = parseReportingClause(reportingClause);
    let listener: string | undefined = parsedListener;

    const isPresentFutureReporting = /^(says|will say|has said)$/i.test(originalVerb);
    if (isPresentFutureReporting)
      exceptionsApplied.push('Present/Future Reporting Verb: Reported tense unchanged.');

    let mappedVerb   = 'said';
    let connector    = 'that';
    let quote        = reportedClause.replace(/[.!?]$/, '').trim();
    let replyPhrase  = '';

    // ── 1. Vocative ──
    const vocMatch = quote.match(/^([A-Z][a-z]+),\s+(.*)$/);
    if (vocMatch && !/^(Yes|No|Well|Sir|Madam|Please|Sorry|Excuse|However|Therefore)$/i.test(vocMatch[1])) {
      listener = vocMatch[1];
      quote    = vocMatch[2];
      exceptionsApplied.push(`Vocative: Extracted "${listener}" as listener.`);
    }

    // ── 2. Respectful address (Sir/Madam) ──
    const respectMatch = quote.match(/^(Sir|Madam)[,\s]+(.*)$/i);
    if (respectMatch) {
      quote    = respectMatch[2];
      mappedVerb = 'respectfully said';
      exceptionsApplied.push('Respectful Address: "respectfully" prepended to reporting verb.');
    }

    // ── 3. Yes/No ──
    const yesNoExact = quote.match(/^(Yes|No)$/i);
    const yesNoStart = quote.match(/^(Yes|No)[,\s]+(.*)$/i);
    if (yesNoExact) {
      const polarity = yesNoExact[1].toLowerCase() === 'yes' ? 'affirmative' : 'negative';
      replyPhrase = `replied in the ${polarity}`;
      quote       = '';
      exceptionsApplied.push(`Reply: "replied in the ${polarity}".`);
    } else if (yesNoStart) {
      const polarity = yesNoStart[1].toLowerCase() === 'yes' ? 'affirmative' : 'negative';
      replyPhrase = `replied in the ${polarity} and`;
      quote       = yesNoStart[2];
      exceptionsApplied.push(`Reply: "replied in the ${polarity} and".`);
    }

    // ── 4. Classify ──
    const isExclamatory = quote.endsWith('!')
      || /^(hurrah|hooray|alas|bravo|wow|pooh|ugh|yuck|what a|what an|how\s)\b/i.test(quote);
    const isOptative    = /^may\b/i.test(quote);
    const isLetUs       = /^let\s*'?\s*s\b|^let\s+us\b/i.test(quote);
    const isLetMe       = /^let\s+me\b/i.test(quote);
    const isInterrogative = !isExclamatory && !isOptative && !isLetUs && !isLetMe
      && (quote.endsWith('?')
          || /^(are|is|am|was|were|do|does|did|will|would|can|could|shall|should|may|might)\s+\w/i.test(quote));
    const isImperative  = !isExclamatory && !isOptative && !isLetUs && !isLetMe && !isInterrogative
      && (nlp(quote).has('#Imperative')
          || /^(please|kindly|don'?t|do not|never|always)\b/i.test(quote));

    // ── 5. Set verb/connector per type ──
    if (isExclamatory) {
      const { verb, quote: excQ } = transformExclamatory(quote, exceptionsApplied);
      mappedVerb = verb;
      quote      = excQ;
      connector  = 'that';

    } else if (isOptative) {
      mappedVerb = 'prayed';
      connector  = 'that';
      exceptionsApplied.push('Optative → "prayed".');

    } else if (isLetUs) {
      mappedVerb = 'suggested';
      connector  = 'that they should';
      quote      = quote.replace(/^let\s*'?\s*s\s+|^let\s+us\s+/i, '');
      exceptionsApplied.push('"Let\'s/Let us" → suggested that they should.');

    } else if (isLetMe) {
      mappedVerb = 'requested';
      connector  = 'to be allowed to';
      quote      = quote.replace(/^let\s+me\s+/i, '');
      exceptionsApplied.push('"Let me" → requested to be allowed to.');

    } else if (isImperative) {
      const hasNeg = /^(don'?t|do not|never)\b/i.test(quote);
      if (/please|kindly/i.test(quote)) mappedVerb = 'requested';
      else if (hasNeg)                   mappedVerb = 'advised';
      else                               mappedVerb = 'ordered';
      connector = hasNeg ? 'not to' : 'to';
      quote     = quote.replace(/^(please|kindly|don'?t|do not|never)\s+/i, '');
      exceptionsApplied.push(`Imperative → "${mappedVerb}" + "${connector}".`);

    } else if (isInterrogative) {
      mappedVerb = 'asked';
      const whMatch = quote.match(/^(who|what|where|when|why|how|which|whose|whom)\b/i);
      if (whMatch) {
        connector = whMatch[1].toLowerCase();
        quote     = quote.replace(/^(who|what|where|when|why|how|which|whose|whom)\s+/i, '');
        exceptionsApplied.push(`Wh-Question: connector = "${connector}".`);
      } else {
        connector = 'if';
        exceptionsApplied.push('Yes/No Question: connector = "if".');
      }
      quote = fixInterrogativeWordOrder(quote, exceptionsApplied);

    } else {
      // Assertive
      mappedVerb = (originalVerb === 'said to' || !!listener) ? 'told' : 'said';
      connector  = 'that';
    }

    // Respectful override
    if (respectMatch && mappedVerb !== 'respectfully said') {
      mappedVerb = `respectfully ${mappedVerb}`;
    }

    // ── 6. Apply transformations ──
    if (quote) {
      // Pronoun replacement
      quote = replaceDirectPronouns(quote, speaker, listener, exceptionsApplied);

      // Subject-verb agreement
      quote = fixSubjectVerbAgreement(quote);

      // Tense backshift
      // Exclamatory "it was a very ..." — the "was" is already past, don't backshift again
      const skipBackshift = isImperative || isLetMe || isPresentFutureReporting || isExclamatory;
      if (!skipBackshift) {
        quote = backshiftTense(quote, exceptionsApplied);
      }

      // Adverb shift
      quote = shiftAdverbsDirectToIndirect(quote, exceptionsApplied);

      // Lowercase the first character of the quote unless it is a proper noun
      // (proper nouns have length > 1 and the second char is also lowercase, but we
      // can't reliably detect proper nouns here, so we lowercase everything except
      // known proper-noun patterns like names. A simple heuristic: if the word is
      // not in the first position of the original reported clause, lowercase it.)
      quote = quote.charAt(0).toLowerCase() + quote.slice(1);
    }

    // ── 7. Build reporting part ──
    const listenerVerbs = ['told', 'asked', 'requested', 'ordered', 'advised', 'suggested'];
    const needsListener = listenerVerbs.some(v => mappedVerb.includes(v));
    let reportingPart = (listener && needsListener)
      ? `${speaker} ${mappedVerb} ${listener}`
      : `${speaker} ${mappedVerb}`;

    if (isPresentFutureReporting) {
      const pv = originalVerb === 'says' && listener ? 'tells' : originalVerb;
      reportingPart = listener ? `${speaker} ${pv} ${listener}` : `${speaker} ${pv}`;
    }

    // ── 8. Assemble ──
    let convertedText: string;
    if (replyPhrase && quote) {
      convertedText = `${speaker} ${replyPhrase} ${mappedVerb} ${connector} ${quote}`;
    } else if (replyPhrase && !quote) {
      convertedText = `${speaker} ${replyPhrase}`;
    } else {
      convertedText = `${reportingPart} ${connector} ${quote}`;
    }

    convertedText = convertedText.replace(/\s+/g, ' ').trim();
    // Strip commas before coordinating conjunctions BUT/AND/OR (not 'so', which is a result connector)
    convertedText = convertedText.replace(/,\s*(but|and|or|yet|nor)\b/gi, ' $1');
    if (!convertedText.endsWith('.')) convertedText += '.';

    return {
      type: 'narration',
      originalSpeech: 'Direct Speech',
      convertedSpeech: 'Indirect Speech',
      convertedText,
      reportingVerb: mappedVerb,
      speaker,
      listener,
      explanation:
        'Transformed Direct Speech into Indirect (Reported) Speech applying reporting verb, ' +
        'connector, pronoun mapping, tense backshift, and adverb shifts.',
      exceptionsApplied,
    };

  // ════════════════════════════════════════════════════════════════════════════
  // INDIRECT → DIRECT
  // ════════════════════════════════════════════════════════════════════════════
  } else {
    const matchIndirect = trimmed.match(
      /^(.*?)\b(said to|said|told|asked|exclaimed|prayed|advised|ordered|suggested|requested)\b\s+(that they should|to be allowed to|that|if|whether|to|not to|where|what|why|when|how)\s+(.*)$/i
    );

    let reportingPart = 'He said';
    let connector     = 'that';
    let reportedPart  = trimmed;

    if (matchIndirect) {
      const spk = matchIndirect[1].trim();
      const vrb = matchIndirect[2].trim();
      reportingPart = spk ? `${spk} ${vrb}` : `He ${vrb}`;
      connector     = matchIndirect[3].trim().toLowerCase();
      reportedPart  = matchIndirect[4].trim().replace(/\.+$/, '');
    }

    exceptionsApplied.push('Identified Indirect Speech; extracted reporting clause.');

    let directQuote = reportedPart;

    if (connector === 'if' || connector === 'whether') {
      const qm = directQuote.match(/^(I|he|she|we|they|it)\s+(am|is|are|was|were|could|would|should|might|had)\s+(.*)$/i);
      if (qm) {
        const subj = qm[1], aux = qm[2], rest = qm[3];
        const dSubj = ['he','she','it'].includes(subj.toLowerCase()) ? 'you' : 'we';
        const dAux  = ['was','were','am','is','are'].includes(aux.toLowerCase()) ? 'are' : aux;
        directQuote = `${dAux} ${dSubj} ${rest}?`;
      } else {
        directQuote = directQuote
          .replace(/\bhe\b/gi,'I').replace(/\bshe\b/gi,'I')
          .replace(/\bhis\b/gi,'my').replace(/\bher\b/gi,'my')
          .replace(/\bwas\b/gi,'am').replace(/\bwere\b/gi,'are')
          .replace(/\bhad been\b/gi,'have been').replace(/\bhad\b/gi,'have')
          .replace(/\bwould\b/gi,'will').replace(/\bcould\b/gi,'can')
          .replace(/\bmight\b/gi,'may');
        if (!directQuote.endsWith('?')) directQuote += '?';
      }
    } else if (connector === 'to' || connector === 'not to') {
      directQuote = connector === 'not to' ? `Don't ${directQuote}` : directQuote;
      directQuote = directQuote.charAt(0).toUpperCase() + directQuote.slice(1);
      if (!directQuote.endsWith('.')) directQuote += '.';
    } else {
      directQuote = directQuote
        .replace(/\bhe\b/gi,'I').replace(/\bshe\b/gi,'I')
        .replace(/\bhis\b/gi,'my').replace(/\bher\b/gi,'my')
        .replace(/\bthey\b/gi,'we').replace(/\btheir\b/gi,'our').replace(/\bthem\b/gi,'us')
        .replace(/\bwas\b/gi,'am').replace(/\bwere\b/gi,'are')
        .replace(/\bhad been\b/gi,'have been').replace(/\bhad\b/gi,'have')
        .replace(/\bwould\b/gi,'will').replace(/\bcould\b/gi,'can')
        .replace(/\bmight\b/gi,'may').replace(/\bshould\b/gi,'shall');
      exceptionsApplied.push('Restored 1st-person pronouns and forward-shifted tenses.');
    }

    directQuote = shiftAdverbsIndirectToDirect(directQuote, exceptionsApplied);
    directQuote = directQuote.charAt(0).toUpperCase() + directQuote.slice(1);
    if (!directQuote.endsWith('.') && !directQuote.endsWith('?') && !directQuote.endsWith('!'))
      directQuote += '.';

    const directReportingPart = reportingPart.replace(/\btold\b/i, 'said to');
    const convertedText = `${directReportingPart}, "${directQuote}"`;

    return {
      type: 'narration',
      originalSpeech: 'Indirect Speech',
      convertedSpeech: 'Direct Speech',
      convertedText,
      reportingVerb: 'said',
      speaker: 'He',
      explanation:
        'Transformed Indirect (Reported) Speech back into Direct Speech by restoring quotes, ' +
        '1st-person pronouns, present tense, and direct adverbs.',
      exceptionsApplied,
    };
  }
}
