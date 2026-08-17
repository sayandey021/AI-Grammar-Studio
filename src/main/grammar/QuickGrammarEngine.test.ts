import { describe, it, expect } from 'vitest';
import { QuickGrammarEngine } from './QuickGrammarEngine';

describe('QuickGrammarEngine', () => {
  it('should detect double spaces', async () => {
    const engine = new QuickGrammarEngine();
    const result = await engine.check('This has  two spaces.');
    
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].issue).toBe('  ');
    expect(result.suggestions[0].replacements).toContain(' ');
  });

  it('should detect "their is"', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('I think their is a problem.');
    
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].issue.toLowerCase()).toBe('their');
    expect(result.suggestions[0].replacements).toContain('there');
  });

  it('should return empty suggestions for clean text', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('This is clean text.');
    
    expect(result.suggestions.length).toBe(0);
  });

  it('should format ALL CAPS words to first letter capital only', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('PLEASE help me.');
    
    const capsSug = result.suggestions.find(s => s.issue === 'PLEASE');
    expect(capsSug).toBeDefined();
    expect(capsSug?.replacements).toContain('Please');
  });

  it('should capitalize nouns and proper nouns', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('I live in london.');
    
    const nounSug = result.suggestions.find(s => s.issue === 'london');
    expect(nounSug).toBeDefined();
    expect(nounSug?.replacements).toContain('London');
  });

  it('should detect wordiness and suggest concise alternatives', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('We leave due to the fact that it is late.');
    
    const wordySug = result.suggestions.find(s => s.issue.toLowerCase() === 'due to the fact that');
    expect(wordySug).toBeDefined();
    expect(wordySug?.replacements).toContain('because');
  });

  it('should detect confusion pairs like more then', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('This is better then that.');
    
    const confuseSug = result.suggestions.find(s => s.issue.toLowerCase() === 'better then');
    expect(confuseSug).toBeDefined();
    expect(confuseSug?.replacements).toContain('better than');
  });

  it('should detect informal business tone and suggest professional alternatives', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('Please hit me up when ready.');
    
    const toneSug = result.suggestions.find(s => s.issue.toLowerCase() === 'hit me up');
    expect(toneSug).toBeDefined();
    expect(toneSug?.replacements).toContain('contact me');
  });

  it('should detect passive voice constructions', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('The document was created by John.');
    
    const passiveSug = result.suggestions.find(s => s.issue.toLowerCase().includes('was created by'));
    expect(passiveSug).toBeDefined();
    expect(passiveSug?.explanation).toContain('Passive voice detected');
  });

  it('should calculate readability metrics', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('This is a simple sentence to evaluate metrics.');
    
    expect(result.readability).toBeDefined();
    expect(result.readability?.wordCount).toBe(8);
    expect(result.readability?.score).toBeGreaterThan(0);
  });

  it('should convert informal phrasal verbs to formal alternatives', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('We need to call off the meeting.');
    
    const phrasalSug = result.suggestions.find(s => s.issue.toLowerCase() === 'call off');
    expect(phrasalSug).toBeDefined();
    expect(phrasalSug?.replacements).toContain('cancel');
  });

  it('should suggest active voice transformation for passive sentences', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('The letter was written by the manager.');
    
    const voiceSug = result.suggestions.find(s => s.issue.toLowerCase().includes('was written by'));
    expect(voiceSug?.replacements[0]).toContain('The manager wrote the letter');
  });

  it('should enforce capitalization in direct speech quotes', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.check('He said, "hello world".');
    
    const speechSug = result.suggestions.find(s => s.issue === 'h');
    expect(speechSug).toBeDefined();
    expect(speechSug?.replacements).toContain('H');
  });

  it('should apply context-aware homophone correction', async () => {
const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    // there / their
    const result1 = await engine.check('They parked there car in the garage.');
    const sug1 = result1.suggestions.find(s => s.issue.toLowerCase() === 'there');
    expect(sug1).toBeDefined();
    expect(sug1?.replacements).toContain('their');

    // to / too
    const result2 = await engine.check('It is to hot outside.');
    const sug2 = result2.suggestions.find(s => s.issue.toLowerCase() === 'to');
    expect(sug2).toBeDefined();
    expect(sug2?.replacements).toContain('too');

    // affect / effect
    const result3 = await engine.check('The medicine had no affect on the patient.');
    const sug3 = result3.suggestions.find(s => s.issue.toLowerCase() === 'affect');
    expect(sug3).toBeDefined();
    expect(sug3?.replacements).toContain('effect');
    
    // see / sea
    const result4 = await engine.check('I want to sea the new movie.');
    const sug4 = result4.suggestions.find(s => s.issue.toLowerCase() === 'sea');
    expect(sug4).toBeDefined();
    expect(sug4?.replacements).toContain('see');
  });

  it('should analyze sentence clauses and classify sentence structure', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const clauseResult = await engine.analyze(
      'The teacher explained the lesson, but the students were distracted because the bell was ringing.',
      'clause'
    );

    expect(clauseResult.type).toBe('clause');
    expect(clauseResult.data).toBeDefined();
    expect(clauseResult.data.length).toBeGreaterThan(0);
    const sent = clauseResult.data[0];
    expect(sent.classification).toBeDefined();
    expect(sent.clauses.length).toBeGreaterThan(1);
  });

  it('should transform active voice to passive voice', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const voiceResult = await engine.analyze(
      'The engineer fixed the broken server yesterday.',
      'voice'
    );

    expect(voiceResult.type).toBe('voice');
    expect(voiceResult.originalVoice).toBe('Active Voice');
    expect(voiceResult.convertedVoice).toBe('Passive Voice');
    expect(voiceResult.convertedText).toBeDefined();
  });

  it('should apply special preposition exception (known to)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('I know him.', 'voice');

    expect(result.type).toBe('voice');
    expect(result.convertedText.toLowerCase()).toContain('known to me');
    expect(result.exceptionsApplied).toContain("Special Preposition Exception: Verb 'know' takes 'to' instead of 'by'");
  });

  it('should handle pronoun case shifts in active to passive transformation', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('She loves me.', 'voice');

    expect(result.type).toBe('voice');
    expect(result.convertedText.toLowerCase()).toContain('i am loved by her');
  });

  it('should detect intransitive verbs and prevent invalid voice change', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('He slept for eight hours.', 'voice');

    expect(result.type).toBe('voice');
    expect(result.originalVoice).toBe('Intransitive (No Voice Change)');
    expect(result.explanation).toContain('intransitive');
  });

  it('should transform imperative sentences (commands and requests) including shut', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const shutResult = await engine.analyze('shut the door.', 'voice');
    expect(shutResult.originalVoice).toBe('Imperative Sentence');
    expect(shutResult.convertedText).toBe('Let the door be shut.');

    const commandResult = await engine.analyze('Close the door.', 'voice');
    expect(commandResult.originalVoice).toBe('Imperative Sentence');
    expect(commandResult.convertedText.toLowerCase()).toContain('let the door be closed');

    const requestResult = await engine.analyze('Please help me.', 'voice');
    expect(requestResult.originalVoice).toBe('Imperative Sentence');
    expect(requestResult.convertedText.toLowerCase()).toContain('you are requested to help me');
  });

  it('should handle phrasal verbs and keep preposition attached to verb', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('They laughed at the poor man.', 'voice');
    expect(result.type).toBe('voice');
    expect(result.convertedText.toLowerCase()).toContain('laughed at');
  });

  it('should transform quasi-passive sensory sentences', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('Honey tastes sweet.', 'voice');
    expect(result.originalVoice).toBe('Quasi-Passive');
    expect(result.convertedText.toLowerCase()).toContain('honey is sweet when it is tasted');
  });

  it('should transform interrogative questions (Who / Do / Did)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('Who wrote this book?', 'voice');
    expect(result.originalVoice).toBe('Interrogative Sentence');
    expect(result.convertedText.toLowerCase()).toContain('by whom was this book written?');
  });

  it('should transform infinitive structures (It is time to...)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('It is time to close the shop.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('it is time for the shop to be closed.');
  });

  it('should transform negative imperatives (Do not / Don\'t)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('Do not insult the poor.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('let not the poor be insulted');
  });

  it('should transform causative verbs to use to-infinitive in passive', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('I made him cry.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('was made to cry by me');
  });

  it('should retain participle phrases after object', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('I saw her crossing the road.', 'voice');
    expect(result.convertedText.toLowerCase()).toMatch(/seen.*crossing|crossing.*seen/i);
  });

  it('should promote indirect object in ditransitive sentences', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('The manager handed me a promotion letter.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('i was handed a promotion letter by the manager');
  });

  it('should transform complex "say that" sentences', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('People say that he is a genius.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('it is said that he is a genius');
  });

  it('should handle reflexive pronouns without shifting subject', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('He blamed himself for the mistake.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('he was blamed for the mistake by himself');
  });

  it('should passivize gerund phrases (remember being taken)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('I remember my grandfather taking me to the zoo.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('i remember being taken to the zoo by my grandfather');
  });

  it('should transform past perfect complex sentences (suspected that)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('The police suspected that the thief had stolen the jewels.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('it was suspected by the police that the jewels had been stolen by the thief');
  });

  it('should handle special prepositions like shocked at', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('His behavior shocked everyone.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('everyone was shocked at his behavior');
  });

  it('should omit indefinite agents and possessives', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze("One must keep one's promises.", 'voice');
    expect(result.convertedText.toLowerCase()).toContain('promises must be kept.');
  });

  it('should transform obligation infinitives', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('I have a lot of work to do.', 'voice');
    expect(result.convertedText.toLowerCase()).toMatch(/work.*done|work.*do/i);
  });

  it('should handle prepositional interrogatives (Whom did you laugh at?)', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('Whom did you laugh at?', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('who was laughed at by you');
  });

  it('should keep bare infinitive for let in causative form', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('They let me go.', 'voice');
    expect(result.convertedText.toLowerCase()).toMatch(/allowed to go|let go/i);
  });

  it('should retain time adjuncts at the end of passive sentences', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('He wrote a letter yesterday.', 'voice');
    expect(result.convertedText.toLowerCase()).toMatch(/letter.*written.*yesterday|written.*letter.*yesterday/i);
  });

  it('should promote first noun object in ditransitive noun-noun sentences', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('He gave the boy a book.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('the boy was given a book by him');
  });

  it('should preserve remainders in passive to active transformations', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('She was seen crossing the road by me.', 'voice');
    expect(result.convertedText.toLowerCase()).toBe('i saw her crossing the road.');
  });

  it('should recursively process compound sentences joined by and', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('He ate an apple and she drank some milk.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('an apple was eaten by him and some milk was drunk by her.');
  });

  it('should recursively process complex sentences joined by that', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('The police suspected that the thief had stolen the jewels.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('it was suspected by the police that the jewels had been stolen by the thief.');
  });

  // --------------------------------------------------------------------------------------
  // Phase 4: Extreme Edge Cases & Advanced Grammar Rules Tests
  // --------------------------------------------------------------------------------------
  
  it('should enforce subjunctive mood auxiliary be after recommendation verbs', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('The judge insisted that the police arrest the suspect.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('the suspect be arrested by the police');
  });

  it('should passivize embedded gerunds correctly', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('I like people praising me.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('i like being praised');
  });

  it('should split relative adjective clauses to passivize the modifier', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('The committee wrote off the debts that the farmers owed.', 'voice');
    expect(result.convertedText.toLowerCase()).toMatch(/debts.*owed|written off/i);
  });

  it('should push objective complements starting with "as" to the remainder', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('They looked upon him as a traitor.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('he was looked upon');
  });

  it('should handle inverted emphatic structures', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('Not a word did he speak.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('not a word was spoken by him');
  });

  it('should handle complex double-object infinitive chains', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('I did not expect anyone to find out the secret.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('i did not expect the secret to be found out');
  });

  it('should support 3-word phrasal transitive idioms like lose sight of', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('The radar lost sight of the aircraft.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('the aircraft was lost sight of by the radar');
  });

  it('should handle negative interrogative imperatives', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('Why not accept the proposal?', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('why should the proposal not be accepted?');
  });

  it('should handle multi-clause correlatives As X so Y', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('As adversity tests a man, so prosperity spoils him.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('as a man is tested by adversity, so he is spoilt by prosperity');
  });

  it('should block voice change for stative transitive verbs', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    const result = await engine.analyze('This suit fits you well.', 'voice');
    expect(result.convertedText.toLowerCase()).toContain('no passive voice possible');
  });

  it('should handle agentless passives in passive to active transformation', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const result = await engine.analyze('The server was updated.', 'voice');

    expect(result.type).toBe('voice');
    expect(result.originalVoice).toBe('Passive Voice');
    expect(result.convertedVoice).toBe('Active Voice');
    expect(result.convertedText.toLowerCase()).toContain('someone updated');
  });

  it('should transform direct speech to indirect speech narration', async () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);
    
    const narrationResult = await engine.analyze(
      'He said, "I am working on the new feature."',
      'narration'
    );

    expect(narrationResult.type).toBe('narration');
    expect(narrationResult.originalSpeech).toBe('Direct Speech');
    expect(narrationResult.convertedSpeech).toBe('Indirect Speech');
    expect(narrationResult.convertedText).toContain('he');
    if (narrationResult.rulesApplied) {
      expect(narrationResult.rulesApplied.length).toBeGreaterThan(0);
    }
  });

  describe('Phase 5: Extreme Edge Cases', () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);

    it('handles Preposition-Staking Trap', async () => {
      const result = await engine.analyze('The audience laughed at and jeered the speaker.', 'voice');
      expect(result.convertedText).toMatch(/The speaker was laughed at and jeered by the audience/i);
    });

    it('handles Double-Infinitive Matrix', async () => {
      const result = await engine.analyze('I want him to invite her to play the piano.', 'voice');
      expect(result.convertedText).toMatch(/I want her to be invited by him to play the piano/i);
    });

    it('handles Adjunct Inversion', async () => {
      const result = await engine.analyze('Seldom do people witness such a magnificent celestial event.', 'voice');
      expect(result.convertedText).toMatch(/Seldom is such a magnificent celestial event witnessed/i);
    });

    it('handles Cognate Objects', async () => {
      const result = await engine.analyze('The martyr died a glorious death for his country.', 'voice');
      expect(result.convertedText).toMatch(/A glorious death for his country was died by the martyr/i);
    });

    it('handles Nested "That" Clauses', async () => {
      const result = await engine.analyze('One expects that the government will lower taxes next year.', 'voice');
      expect(result.convertedText).toMatch(/It is expected that taxes will be lowered by the government next year/i);
    });

    it('handles Bare Infinitive Deception', async () => {
      const result = await engine.analyze('I observed the tension bid him speak the truth.', 'voice');
      expect(result.convertedText).toMatch(/He was observed to be bidden by the tension to speak the truth/i);
    });

    it('handles Mid-Sentence Gerund Phase', async () => {
      const result = await engine.analyze('He resented his peers making fun of his accent.', 'voice');
      expect(result.convertedText).toMatch(/He resented his accent being made fun of by his peers/i);
    });

    it('handles Stative Transitive Trap', async () => {
      const result = await engine.analyze('The book contains twenty chapters.', 'voice');
      expect(result.convertedText).toMatch(/No passive voice possible/i);
    });

    it('handles Multi-Agent Correlative Clashing', async () => {
      const result = await engine.analyze('While the general planned the strategy, the soldiers executed the orders.', 'voice');
      expect(result.convertedText).toMatch(/While the strategy was planned by the general, the orders were executed by the soldiers/i);
    });
  });

  describe('Phase 6: Grammar Edge Cases (Part 2)', () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);

    it('handles Stative verbs like cost', async () => {
      const result = await engine.analyze('This luxury villa costs a fortune.', 'voice');
      expect(result.convertedText).toMatch(/No passive voice possible/i);
    });

    it('handles Cognate Object extraction with adjuncts', async () => {
      const result = await engine.analyze('The singer dreamed a strange dream last night.', 'voice');
      expect(result.convertedText).toMatch(/A strange dream was dreamt by the singer last night/i);
    });

    it('handles Quasi-Passives', async () => {
      const result = await engine.analyze('This stone feels rough.', 'voice');
      expect(result.convertedText).toMatch(/This stone is rough when it is felt/i);
    });

    it('handles Non-Human Agents (adorn with)', async () => {
      const result = await engine.analyze('Pearls adorned her neck.', 'voice');
      expect(result.convertedText).toMatch(/Her neck was adorned with pearls/i);
    });

    it('handles Let Infinitive Manipulation', async () => {
      const result = await engine.analyze('The teacher let the students leave early.', 'voice');
      expect(result.convertedText).toMatch(/The students were allowed to leave early by the teacher/i);
    });

    it('handles Dropped Agents (they)', async () => {
      const result = await engine.analyze('They are constructing a new highway nearby.', 'voice');
      expect(result.convertedText).toMatch(/A new highway nearby is being constructed/i);
    });

    it('handles Fixed Preposition verbs (cope with)', async () => {
      const result = await engine.analyze('You must cope with this difficult situation.', 'voice');
      expect(result.convertedText).toMatch(/This difficult situation must be coped with by you/i);
    });

    it('handles It is time clauses', async () => {
      const result = await engine.analyze('It is time to wind up the meeting.', 'voice');
      expect(result.convertedText).toMatch(/It is time for the meeting to be wound up/i);
    });

    it('handles Transitive Verbs Used Reflexively', async () => {
      const result = await engine.analyze('The actor fanned himself on stage.', 'voice');
      expect(result.convertedText).toMatch(/The actor was fanned on stage by himself/i);
    });
  });

  describe('Phase 7: The Final Boss (Master-Class Exceptions)', () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);

    it('handles Interrogative (Who) shift', async () => {
      const result = await engine.analyze('Who wrote this book?', 'voice');
      expect(result.convertedText).toMatch(/By whom was this book written\?/i);
    });

    it('handles Moral Imperative', async () => {
      const result = await engine.analyze('Help the poor.', 'voice');
      expect(result.convertedText).toMatch(/The poor should be helped/i);
    });

    it('handles Impersonal "There" clauses', async () => {
      const result = await engine.analyze('People believe that there is a spy among us.', 'voice');
      expect(result.convertedText).toMatch(/It is believed that there is a spy among us/i);
    });

    it('handles Subject-Complement Traps', async () => {
      const result = await engine.analyze('The committee appointed her Chief Executive.', 'voice');
      expect(result.convertedText).toMatch(/She was appointed Chief Executive by the committee/i);
    });

    it('handles Causative Have state shift', async () => {
      const result = await engine.analyze('I had the barber cut my hair.', 'voice');
      expect(result.convertedText).toMatch(/I had my hair cut by the barber/i);
    });

    it('handles Perfect Infinitive Matrix', async () => {
      const result = await engine.analyze('They claim to have solved the puzzle.', 'voice');
      expect(result.convertedText).toMatch(/The puzzle is claimed to have been solved/i);
    });

    it('handles Adjectival Infinitive Subjects', async () => {
      const result = await engine.analyze('It is impossible to finish the work today.', 'voice');
      expect(result.convertedText).toMatch(/The work is impossible to be finished today/i);
    });

    it('handles Double Objects with Proper Nouns', async () => {
      const result1 = await engine.analyze('The manager handed John a termination letter.', 'voice');
      expect(result1.convertedText).toMatch(/John was handed a termination letter by the manager/i);

      const result2 = await engine.analyze('They offered James a new job.', 'voice');
      expect(result2.convertedText).toMatch(/James was offered a new job/i);
    });

    it('handles Let / Allowed To bidirectional transformations', async () => {
      const activeResult = await engine.analyze('He let me use his laptop.', 'voice');
      expect(activeResult.convertedText).toMatch(/I was allowed to use his laptop by him/i);

      const passiveResult = await engine.analyze('I was allowed to use his laptop by him.', 'voice');
      expect(passiveResult.convertedText).toMatch(/He let me use his laptop/i);

      const pluralResult = await engine.analyze('She let the children play outside.', 'voice');
      expect(pluralResult.convertedText).toMatch(/The children were allowed to play outside by her/i);
    });
  });

  describe('Phase 8: Rule-Based Narration Engine', () => {
    const mockStorage = { getSettings: () => ({ customDictionary: [] }) };
    const engine = new QuickGrammarEngine(mockStorage);

    it('converts Direct to Indirect Assertive speech with tense and adverb shifts', async () => {
      const result = await engine.analyze('He said, "I am writing a letter today."', 'narration');
      expect(result.convertedText).toBe('He said that he was writing a letter that day.');
      expect(result.originalSpeech).toBe('Direct Speech');
      expect(result.convertedSpeech).toBe('Indirect Speech');
    });

    it('handles speaker/listener contextual pronoun shifts', async () => {
      const result = await engine.analyze('She said to me, "I will help you tomorrow."', 'narration');
      expect(result.convertedText).toMatch(/She (said|told me) that she would help (me|I) the next day/i);
    });

    it('preserves present tense for Universal Truths', async () => {
      const result = await engine.analyze('The teacher said, "The earth revolves around the sun."', 'narration');
      expect(result.convertedText).toMatch(/The teacher said that The earth revolves around the sun/i);
    });

    it('converts Interrogative Wh-Questions', async () => {
      const result = await engine.analyze('John said to me, "Where are you going?"', 'narration');
      expect(result.convertedText).toMatch(/John (asked|told me).*where.*going/i);
    });

    it('converts Interrogative Yes/No Questions', async () => {
      const result = await engine.analyze('She asked, "Are you coming to the party?"', 'narration');
      expect(result.convertedText).toMatch(/She asked if.*coming to the party/i);
    });

    it('converts Imperative Commands & Advice', async () => {
      const result = await engine.analyze('Mother said to me, "Do not run in the sun."', 'narration');
      expect(result.convertedText).toMatch(/Mother (advised|asked).*not.*run in the sun/i);
    });

    it('converts Exclamatory Sentences with interjections', async () => {
      const result = await engine.analyze('He said, "Hurrah! We won the game."', 'narration');
      expect(result.convertedText).toMatch(/He exclaimed with joy that they.*won the game/i);
    });

    it('converts Indirect Speech back to Direct Speech', async () => {
      const result = await engine.analyze('He said that he was writing a letter that day.', 'narration');
      expect(result.convertedText).toBe('He said, "I am writing a letter today."');
      expect(result.originalSpeech).toBe('Indirect Speech');
      expect(result.convertedSpeech).toBe('Direct Speech');
    });

    it('reconstructs Direct Speech question structures from Indirect Speech', async () => {
      const result = await engine.analyze('She asked if I was coming to the party.', 'narration');
      expect(result.convertedText).toMatch(/She asked, "Are (you|we) coming to the party\?"/i);
    });

    describe('Phase 9: Advanced Narration Edge Cases', () => {
      it('handles Present/Future Reporting Verbs (no tense shift)', async () => {
        const result = await engine.analyze('He says, "I am happy."', 'narration');
        expect(result.convertedText).toBe('He says that he is happy.');
      });

      it('handles Vocative Address Extraction', async () => {
        const result = await engine.analyze('The teacher said, "John, I am waiting."', 'narration');
        expect(result.convertedText).toMatch(/The teacher (told John|said).*waiting/i);
      });

      it('handles Let us (Proposals)', async () => {
        const result = await engine.analyze('He said, "Let\'s go to the park."', 'narration');
        expect(result.convertedText).toMatch(/He (proposed|suggested) that they should.*to the park/i);
      });

      it('handles Let me (Requests)', async () => {
        const result = await engine.analyze('The boy said, "Let me go."', 'narration');
        expect(result.convertedText).toMatch(/The boy requested (to let him go|to be allowed to go)/i);
      });

      it('handles Respectful Addresses (Sir/Madam)', async () => {
        const result = await engine.analyze('The student said, "Sir, I am late."', 'narration');
        expect(result.convertedText).toMatch(/The student respectfully said that he was late/i);
      });

      it('handles Replies (Yes/No)', async () => {
        const result1 = await engine.analyze('He said, "Yes, I will come."', 'narration');
        expect(result1.convertedText).toMatch(/He replied in the affirmative and said that he would come/i);

        const result2 = await engine.analyze('She said, "No."', 'narration');
        expect(result2.convertedText).toMatch(/She replied in the negative/i);
      });

      it('handles Historical Facts (no tense shift)', async () => {
        const result = await engine.analyze('The teacher said, "India became independent in 1947."', 'narration');
        expect(result.convertedText).toMatch(/The teacher said that India became independent in 1947/i);
      });

      it('handles Unchanging Modals & Moral Obligations', async () => {
        const result1 = await engine.analyze('He said, "We must respect our parents."', 'narration');
        expect(result1.convertedText).toMatch(/He said that (we|they) must respect (our|their) parents/i);

        const result2 = await engine.analyze('She said, "I must leave now."', 'narration');
        expect(result2.convertedText).toMatch(/She said that she had to leave then/i);
      });
    });
  });
});
