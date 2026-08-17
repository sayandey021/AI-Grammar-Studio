import nlp from 'compromise';

function conjugateDegreeWord(word: string): { base: string, comp: string, sup: string } {
  let w = word.toLowerCase().trim();
  w = w.replace(/^(?:more|most)\s+/, '');

  const irregulars: Record<string, { base: string, comp: string, sup: string }> = {
    'good': { base: 'good', comp: 'better', sup: 'best' },
    'well': { base: 'well', comp: 'better', sup: 'best' },
    'bad': { base: 'bad', comp: 'worse', sup: 'worst' },
    'badly': { base: 'badly', comp: 'worse', sup: 'worst' },
    'far': { base: 'far', comp: 'farther', sup: 'farthest' },
    'little': { base: 'little', comp: 'less', sup: 'least' },
    'much': { base: 'much', comp: 'more', sup: 'most' },
    'many': { base: 'many', comp: 'more', sup: 'most' },
    'late': { base: 'late', comp: 'later', sup: 'latest' },
    'early': { base: 'early', comp: 'earlier', sup: 'earliest' },
    'soon': { base: 'soon', comp: 'sooner', sup: 'soonest' },
    'fast': { base: 'fast', comp: 'faster', sup: 'fastest' },
    'hard': { base: 'hard', comp: 'harder', sup: 'hardest' },
    'high': { base: 'high', comp: 'higher', sup: 'highest' },
    'long': { base: 'long', comp: 'longer', sup: 'longest' },
    'loud': { base: 'loud', comp: 'louder', sup: 'loudest' },
    'near': { base: 'near', comp: 'nearer', sup: 'nearest' },
    'grim': { base: 'grim', comp: 'grimmer', sup: 'grimmest' },
    'slim': { base: 'slim', comp: 'slimmer', sup: 'slimmest' },
    'dim': { base: 'dim', comp: 'dimmer', sup: 'dimmest' },
    'trim': { base: 'trim', comp: 'trimmer', sup: 'trimmest' },
    'prim': { base: 'prim', comp: 'primmer', sup: 'primmest' },
    'thin': { base: 'thin', comp: 'thinner', sup: 'thinnest' },
    'fat': { base: 'fat', comp: 'fatter', sup: 'fattest' },
    'fit': { base: 'fit', comp: 'fitter', sup: 'fittest' },
    'wet': { base: 'wet', comp: 'wetter', sup: 'wettest' },
    'hot': { base: 'hot', comp: 'hotter', sup: 'hottest' },
    'sad': { base: 'sad', comp: 'sadder', sup: 'saddest' },
    'mad': { base: 'mad', comp: 'madder', sup: 'maddest' },
    'glad': { base: 'glad', comp: 'gladder', sup: 'gladdest' },
    'red': { base: 'red', comp: 'redder', sup: 'reddest' },
    'flat': { base: 'flat', comp: 'flatter', sup: 'flattest' },
    'big': { base: 'big', comp: 'bigger', sup: 'biggest' },
  };

  for (const key of Object.keys(irregulars)) {
    if (key === w || irregulars[key].comp === w || irregulars[key].sup === w) {
      return irregulars[key];
    }
  }

  // Reverse comparative / superlative suffixes if word is grimmer, grimmest, happier, happiest, etc.
  let baseWord = w;
  if (w.endsWith('er') && w.length > 3) {
    const stem = w.slice(0, -2);
    if (stem.length >= 3 && stem.charAt(stem.length - 1) === stem.charAt(stem.length - 2)) {
      baseWord = stem.slice(0, -1);
    } else if (stem.endsWith('i')) {
      baseWord = stem.slice(0, -1) + 'y';
    } else {
      baseWord = stem;
    }
  } else if (w.endsWith('est') && w.length > 4) {
    const stem = w.slice(0, -3);
    if (stem.length >= 3 && stem.charAt(stem.length - 1) === stem.charAt(stem.length - 2)) {
      baseWord = stem.slice(0, -1);
    } else if (stem.endsWith('i')) {
      baseWord = stem.slice(0, -1) + 'y';
    } else {
      baseWord = stem;
    }
  }

  if (baseWord.length >= 4 && baseWord.charAt(baseWord.length - 1) === baseWord.charAt(baseWord.length - 2)) {
    const lastChar = baseWord.charAt(baseWord.length - 1);
    if (!['s', 'l', 'z', 'f'].includes(lastChar)) {
      baseWord = baseWord.slice(0, -1);
    }
  }

  if (irregulars[baseWord]) return irregulars[baseWord];

  if (baseWord.endsWith('ly') && baseWord.length > 4) {
    return { base: baseWord, comp: `more ${baseWord}`, sup: `most ${baseWord}` };
  }

  if (baseWord.endsWith('y') && !['a','e','i','o','u'].includes(baseWord.charAt(baseWord.length - 2))) {
    const stem = baseWord.slice(0, -1);
    return { base: baseWord, comp: `${stem}ier`, sup: `${stem}iest` };
  }

  const longSuffixes = ['ful', 'less', 'ing', 'ed', 'ous', 'ish', 'ive', 'able', 'ible', 'ant', 'ent', 'al', 'ic', 'ary', 'ate'];
  let isLong = longSuffixes.some(suf => baseWord.endsWith(suf));
  
  if (!isLong) {
    let wordCleaned = baseWord.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const matches = wordCleaned.match(/[aeiouy]{1,2}/g);
    const syllables = matches ? matches.length : 1;
    if (syllables >= 3) isLong = true;
    else if (syllables === 2 && !['y', 'le', 'er', 'ow'].some(s => baseWord.endsWith(s))) {
      isLong = true;
    }
  }

  if (isLong) {
    return { base: baseWord, comp: `more ${baseWord}`, sup: `most ${baseWord}` };
  }

  if (baseWord.length <= 4 && /^[a-z]*[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(baseWord)) {
    const doubleChar = baseWord.charAt(baseWord.length - 1);
    if (!['w', 'x', 'y'].includes(doubleChar)) {
      return { base: baseWord, comp: `${baseWord}${doubleChar}er`, sup: `${baseWord}${doubleChar}est` };
    }
  }

  if (baseWord.endsWith('e')) {
    return { base: baseWord, comp: `${baseWord}r`, sup: `${baseWord}st` };
  }

  return { base: baseWord, comp: `${baseWord}er`, sup: `${baseWord}est` };
}

export function findDegreeTarget(text: string): { base: string, comp: string, sup: string, isAdverb: boolean } | null {
  const doc = nlp(text);
  const textLower = text.toLowerCase().trim();
  const tokens = textLower.replace(/[.,!?]/g, '').split(/\s+/);

  const ignoreSet = new Set([
    'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'shall', 'would', 'should', 'can', 'could', 'may', 'might', 'must',
    'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'no', 'not', 'other', 'another', 'very', 'extremely', 'really', 'too', 'quite', 'few', 'many', 'much', 'more', 'most', 'less', 'least', 'one', 'of',
    'than', 'as', 'so', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'about', 'he', 'she', 'it', 'they', 'we', 'i', 'you'
  ]);

  // Priority 1: Check for explicit comparative / superlative tokens (-er, -est, or known irregulars)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === 'more' || token === 'most' || token === 'less' || token === 'least' || ignoreSet.has(token)) continue;
    if (token.endsWith('er') || token.endsWith('est') || ['grim', 'slim', 'dim', 'trim', 'fast', 'hard', 'well', 'early', 'soon', 'late', 'high', 'long', 'loud', 'near'].includes(token)) {
      const conj = conjugateDegreeWord(token);
      return { ...conj, isAdverb: ['fast', 'hard', 'well', 'early', 'soon', 'late', 'high', 'long', 'loud', 'near'].includes(conj.base) };
    }
  }

  const allAdjs: any[] = doc.adjectives().conjugate();
  const validAdjs = allAdjs.filter((a: any) => !ignoreSet.has((a?.Adjective || '').toLowerCase()));
  if (validAdjs.length > 0) {
    const word = validAdjs[0].Adjective;
    return { ...conjugateDegreeWord(word), isAdverb: false };
  }

  const adverbs = doc.adverbs().out('array');
  for (const adv of adverbs) {
    const cleanAdv = adv.toLowerCase().replace(/[.,!?]/g, '').trim();
    if (!ignoreSet.has(cleanAdv)) {
      return { ...conjugateDegreeWord(cleanAdv), isAdverb: true };
    }
  }

  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (!ignoreSet.has(token) && token.length > 2) {
      return { ...conjugateDegreeWord(token), isAdverb: false };
    }
  }

  return null;
}

function parseAfterBase(afterBaseText: string, isAdverb: boolean): { group: string, adjunct: string } {
  let cleaned = afterBaseText.replace(/[.,!?]+$/, '').trim();
  if (!cleaned) return { group: '', adjunct: '' };

  const temporalKeywords = [
    'every day', 'every night', 'every week', 'every month', 'every year',
    'all the time', 'always', 'often', 'daily', 'weekly', 'monthly', 'yearly',
    'today', 'yesterday', 'tomorrow', 'now', 'at night', 'in the morning',
    'in the evening', 'in the afternoon', 'on weekends', 'on sunday', 'on monday'
  ];

  let adjunct = '';
  let group = cleaned;

  for (const temp of temporalKeywords) {
    if (cleaned.toLowerCase().endsWith(temp)) {
      adjunct = cleaned.substring(cleaned.length - temp.length).trim();
      group = cleaned.substring(0, cleaned.length - temp.length).trim();
      break;
    }
  }

  group = group.replace(/^(?:a|an|the)\s+/i, '').trim();

  if (/^(?:in|at|on|for|with|during|every)\b/i.test(group) && (isAdverb || !group.match(/^[a-z]+\s+(?:in|at|on|for|with)/i))) {
    adjunct = group + (adjunct ? ' ' + adjunct : '');
    group = '';
  }

  return { group, adjunct };
}

export function transformDegree(text: string): any {
  const target = findDegreeTarget(text);
  if (!target) {
    return {
      type: 'degree',
      originalDegree: 'Unknown',
      transformations: [],
      explanation: 'No gradable adjective or adverb found for degree transformation.'
    };
  }

  const { base, comp, sup, isAdverb } = target;
  const originalText = text.trim();
  const textLower = originalText.toLowerCase();

  let currentDegree = 'Unknown';
  let type = 'Unknown';
  let s1 = '', s2 = '', v = '', groupRaw = '';

  const cleanText = (s: string) => s.replace(/[.,!?]+$/, '').trim();

  const cleanSubject = (s: string) => {
    let cleaned = cleanText(s);
    cleaned = cleaned.replace(/\s+(?:is|are|am|was|were|has|have|had)\s+(?:a|an|the)$/i, '');
    cleaned = cleaned.replace(/\s+(?:a|an|the)$/i, '');
    cleaned = cleaned.replace(/\s+(?:is|are|am|was|were|has|have|had)$/i, '');
    return cleaned.trim();
  };

  const cleanVerb = (verbStr: string) => {
    if (!verbStr) return 'is';
    const vTrimmed = verbStr.replace(/\s+(?:a|an|the)$/i, '').trim();
    if (['very', 'extremely', 'really', 'so', 'too', 'quite'].includes(vTrimmed.toLowerCase())) {
      return 'is';
    }
    return vTrimmed;
  };

  const subjectifyPronoun = (s: string) => {
    const cleaned = cleanText(s);
    const lower = cleaned.toLowerCase();
    const map: Record<string, string> = { 'me': 'I', 'him': 'He', 'her': 'She', 'them': 'They', 'us': 'We' };
    return map[lower] || cleaned;
  };

  const objectifyPronoun = (s: string) => {
    const cleaned = cleanText(s);
    const lower = cleaned.toLowerCase();
    const map: Record<string, string> = { 'he': 'him', 'she': 'her', 'they': 'them', 'we': 'us', 'i': 'me' };
    return map[lower] || cleaned;
  };

  const negateActionVerb = (verb: string) => {
    const vLower = cleanVerb(verb).toLowerCase().trim();
    if (['is', 'are', 'am', 'was', 'were', 'has', 'have', 'had', 'can', 'could', 'will', 'would', 'should'].includes(vLower)) {
      return `${vLower} not`;
    }
    if (vLower.endsWith('s') && vLower.length > 3) {
      const baseV = vLower.replace(/s$/, '');
      return `does not ${baseV}`;
    }
    if (vLower.endsWith('ed') || ['ran', 'spoke', 'drove', 'sang', 'wrote', 'ate', 'went'].includes(vLower)) {
      const lemma = nlp(vLower).verbs().toInfinitive().text() || vLower;
      return `did not ${lemma}`;
    }
    return `do not ${vLower}`;
  };

  const getAgreeingVerb = (subj: string, origVerb: string) => {
    const lowerSubj = subj.toLowerCase().trim();
    const cleanedV = cleanVerb(origVerb);

    if (['is', 'are', 'am', 'was', 'were', 'has', 'have', 'had'].includes(cleanedV.toLowerCase())) {
      const isNot = cleanedV.toLowerCase().includes('not');
      let vLower = cleanedV.toLowerCase().replace(/\s+not/g, '').trim();
      let baseV = cleanedV;

      const isSingularSpecial = ['this', 'that', 'bus', 'glass', 'class', 'grass', 'boss', 'process'].includes(lowerSubj);

      if (lowerSubj === 'i') {
        if (vLower === 'is' || vLower === 'are') baseV = 'am';
        else if (vLower === 'were') baseV = 'was';
      } else if (!isSingularSpecial && (lowerSubj === 'we' || lowerSubj === 'they' || lowerSubj === 'you' || lowerSubj.startsWith('very few') || (lowerSubj.endsWith('s') && !lowerSubj.endsWith('ss')))) {
        if (vLower === 'is' || vLower === 'am') baseV = 'are';
        else if (vLower === 'was') baseV = 'were';
      } else {
        if (vLower === 'are' || vLower === 'am') baseV = 'is';
        else if (vLower === 'were') baseV = 'was';
      }

      if (isNot && !baseV.toLowerCase().includes('not')) {
        baseV = `${baseV} not`;
      }
      return baseV;
    }

    return cleanedV;
  };

  const isVerb = '(?:is|are|am|was|were|has been|have been|has|have|had|do|does|did)';
  const actionVerb = '(?:runs|works|handles|drives|speaks|sings|plays|walks|dances|flies|swims|writes|reads|makes|buys|[a-z]+s|[a-z]+ed|[a-z]+ing|ran|drove|sang|spoke|wrote|went|ate)';
  const verbPattern = `(${isVerb}|${actionVerb})`;

  // ----------------------------------------------------
  // PATTERN MATCHING FOR ALL VERBS & MODIFIERS
  // ----------------------------------------------------

  // 1. Type 3 Positive (e.g. "Very few boys are as tall as Sam.")
  let match = textLower.match(new RegExp(`^very few\\s+(.*?)\\s+${verbPattern}\\s+(?:as|so)\\s+${base}\\s+as\\s+(.*?)\\.?$`));
  if (match) {
    currentDegree = 'Positive'; type = 'Type 3';
    groupRaw = match[1];
    v = cleanVerb(match[2]);
    s1 = cleanSubject(match[3] || '');
  }

  // 2. Type 2 Positive Pattern A (e.g. "No other boy in the class is as tall as Sam.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^no other\\s+(.*?)\\s+${verbPattern}\\s+(?:as|so)\\s+${base}\\s+as\\s+(.*?)\\.?$`));
    if (match) {
      currentDegree = 'Positive'; type = 'Type 2';
      groupRaw = match[1];
      v = cleanVerb(match[2]);
      s1 = cleanSubject(match[3] || '');
    }
  }

  // 3. Type 3 Superlative (e.g. "Sam is one of the tallest boys.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+one of the\\s+(?:${sup}|most ${base})\\s+(.*?)\\.?$`));
    if (match) {
      currentDegree = 'Superlative'; type = 'Type 3';
      s1 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      groupRaw = match[3] || '';
    }
  }

  // 4. Type 3 Comparative (e.g. "Sam is taller than most other boys.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+(?:${comp}|more ${base})\\s+than most other\\s+(.*?)\\.?$`));
    if (match) {
      currentDegree = 'Comparative'; type = 'Type 3';
      s1 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      groupRaw = match[3] || '';
    }
  }

  // 5. Type 2 Superlative (e.g. "Sam is the tallest boy." or "This is the grimmest outcome.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+(?:a\\s+|an\\s+)?(?:the\\s+)?(?:${sup}|most ${base})\\s*(.*?)\\.?$`));
    if (match && !textLower.startsWith('no other') && !textLower.startsWith('very few')) {
      currentDegree = 'Superlative'; type = 'Type 2';
      s1 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      groupRaw = match[3] || '';
    }
  }

  // 6. Type 2 Comparative (e.g. "Sam is taller than any other boy." or "She runs faster than anyone else.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+(?:a\\s+|an\\s+)?(?:${comp}|more ${base})\\s+(.*?\\s+)?than (?:any other|all other|anyone else|anything else|others)\\s*(.*?)\\.?$`));
    if (match) {
      currentDegree = 'Comparative'; type = 'Type 2';
      s1 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      groupRaw = match[3] || match[4] || '';
    }
  }

  // 7. Type 1 Positive (e.g. "Sam is not as tall as John.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+(?:not\\s+)?(?:as|so)\\s+${base}\\s+as\\s+(.*?)\\.?$`));
    if (match) {
      currentDegree = 'Positive'; type = 'Type 1';
      s1 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      s2 = cleanText(match[3] || '');
    }
  }

  // 8. Type 1 Comparative (e.g. "John is taller than Sam." or "The situation is grimmer than yesterday.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+(?:not\\s+)?(?:${comp}|more ${base})\\s+than\\s+(.*?)\\.?$`));
    if (match && !textLower.includes('any other') && !textLower.includes('most other') && !textLower.includes('all other') && !textLower.includes('anyone else') && !textLower.includes('anything else')) {
      currentDegree = 'Comparative'; type = 'Type 1';
      s2 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      s1 = cleanText(match[3] || '');
    }
  }

  // 9. Simple Action / Predicate Positive (e.g. "He works hard every day." or "Sam is a tall boy." or "Iron is a very useful metal.")
  if (currentDegree === 'Unknown') {
    match = textLower.match(new RegExp(`^(.*?)\\s+${verbPattern}\\s+(?:a\\s+|an\\s+)?(?:very\\s+|extremely\\s+|really\\s+|so\\s+|too\\s+)?(?:a\\s+|an\\s+)?${base}\\s*(.*?)\\.?$`));
    if (match && !textLower.startsWith('no other') && !textLower.startsWith('very few') && !textLower.includes(' than ')) {
      currentDegree = 'Positive'; type = 'Type 2';
      s1 = cleanSubject(match[1]);
      v = cleanVerb(match[2]);
      groupRaw = match[3] || '';
    }
  }

  if (currentDegree === 'Unknown') {
    return {
      type: 'degree',
      originalDegree: 'Unknown',
      transformations: [],
      explanation: `Could not parse sentence structure for degree transformation.`
    };
  }

  // Parse group vs adjunct (temporal / prepositional modifiers like "every day", "in the morning")
  const { group, adjunct } = parseAfterBase(groupRaw, isAdverb);
  const adjunctStr = adjunct ? ` ${adjunct}` : '';

  // ----------------------------------------------------
  // GENERATE ACCURATE TRANSFORMATIONS
  // ----------------------------------------------------
  const transformations: any[] = [];
  const cap = (s: string) => {
    const cleaned = s.trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  if (type === 'Type 1') {
    if (currentDegree === 'Positive') {
      const sub2 = subjectifyPronoun(s2);
      const verb2 = getAgreeingVerb(sub2, v);
      transformations.push({ degree: 'Comparative', text: cap(`${sub2} ${verb2} ${comp} than ${objectifyPronoun(s1)}${adjunctStr}.`) });
    } else if (currentDegree === 'Comparative') {
      const sub1 = subjectifyPronoun(s1);
      const negV = negateActionVerb(v);
      transformations.push({ degree: 'Positive', text: cap(`${sub1} ${negV} as ${base} as ${objectifyPronoun(s2)}${adjunctStr}.`) });
    }
  } else if (type === 'Type 2') {
    const hasGroup = group && group.toLowerCase() !== 'one' && group.toLowerCase() !== 'things';
    
    const subject1 = cleanSubject(s1);
    const verb1 = getAgreeingVerb(subject1, v || 'is');

    const compGroup = hasGroup ? `any other ${group}` : (isAdverb ? 'anyone else' : 'any other');
    const positiveGroup = hasGroup ? `No other ${group}` : (isAdverb ? 'No one else' : 'No other');
    const supGroup = hasGroup ? ` ${group}` : '';

    if (currentDegree !== 'Positive') {
      const posVerb = getAgreeingVerb(positiveGroup, v || 'is');
      transformations.push({ degree: 'Positive', text: cap(`${positiveGroup} ${posVerb} as ${base} as ${objectifyPronoun(subject1)}${adjunctStr}.`) });
    }
    if (currentDegree !== 'Comparative') {
      transformations.push({ degree: 'Comparative', text: cap(`${subject1} ${verb1} ${comp} than ${compGroup}${adjunctStr}.`) });
    }
    if (currentDegree !== 'Superlative') {
      const supPrefix = isAdverb && !supGroup ? sup : `the ${sup}`;
      transformations.push({ degree: 'Superlative', text: cap(`${subject1} ${verb1} ${supPrefix}${supGroup}${adjunctStr}.`) });
    }
  } else if (type === 'Type 3') {
    const parts = (group || 'one').trim().split(/\s+/);
    const pluralHead = nlp(parts[0]).nouns().toPlural().text() || parts[0];
    const pluralGroup = [pluralHead, ...parts.slice(1)].join(' ');
    
    const subject1 = cleanSubject(s1);
    const verb1 = getAgreeingVerb(subject1, v || 'is');

    if (currentDegree !== 'Positive') {
      const pluralVerb = getAgreeingVerb(`Very few ${pluralGroup}`, v || 'are');
      transformations.push({ degree: 'Positive', text: cap(`Very few ${pluralGroup} ${pluralVerb} as ${base} as ${objectifyPronoun(subject1)}${adjunctStr}.`) });
    }
    if (currentDegree !== 'Comparative') {
      transformations.push({ degree: 'Comparative', text: cap(`${subject1} ${verb1} ${comp} than most other ${pluralGroup}${adjunctStr}.`) });
    }
    if (currentDegree !== 'Superlative') {
      transformations.push({ degree: 'Superlative', text: cap(`${subject1} ${verb1} one of the ${sup} ${pluralGroup}${adjunctStr}.`) });
    }
  }

  return {
    type: 'degree',
    originalDegree: currentDegree,
    degreeType: type,
    transformations,
    explanation: 'Offline rule-based degree transformation engine.'
  };
}
