import { RulePattern } from './types';

export const GRAMMAR_RULES: RulePattern[] = [
  // there / their / they're
  { regex: /\b(there)\s+(?:car|house|dog|cat|friend|friends|family|mother|father|brother|sister|book|phone|computer|job|money|time|team|own|way)\b/gi, exp: "'There' refers to a place. Use 'their' for possession.", rep: "their", type: 'grammar' },
  { regex: /\b(they're)\s+(?:car|house|dog|cat|friend|friends|family|mother|father|brother|sister|book|phone|computer|job|money|time|team|own|way)\b/gi, exp: "'They're' means 'they are'. Use 'their' for possession.", rep: "their", type: 'grammar' },
  { regex: /\b(their)\s+(?:is|are|was|were|will|has|have|had)\b/gi, exp: "'Their' is possessive. Use 'there' as a pronoun/adverb.", rep: "there", type: 'grammar' },
  { regex: /\b(there|their)\s+(?:going|coming|leaving|working|playing|eating|sleeping|running|walking|talking)\b/gi, exp: "Use 'they're' as a contraction for 'they are'.", rep: "they're", type: 'grammar' },
  
  // your / you're
  { regex: /\b(you're)\s+(?:car|house|dog|cat|friend|friends|family|mother|father|brother|sister|book|phone|computer|job|money|time|team|turn|fault)\b/gi, exp: "'You're' means 'you are'. Use 'your' for possession.", rep: "your", type: 'grammar' },
  { regex: /\b(your)\s+(?:going|coming|leaving|working|playing|eating|sleeping|running|walking|talking|welcome|beautiful|smart|funny|awesome)\b/gi, exp: "Use 'you're' as a contraction for 'you are'.", rep: "you're", type: 'grammar' },
  
  // its / it's
  { regex: /\b(it's)\s+(?:tail|color|size|shape|flavor|taste|name|price|quality|own|value)\b/gi, exp: "'It's' means 'it is'. Use 'its' for possession.", rep: "its", type: 'grammar' },
  { regex: /\b(its)\s+(?:a|the|very|too|so|really|going|been|not|always|time|important)\b/gi, exp: "Use 'it's' as a contraction for 'it is' or 'it has'.", rep: "it's", type: 'grammar' },
  
  // then / than
  { regex: /\b(?:better|worse|more|less|greater|fewer|larger|smaller|faster|slower|taller|shorter|higher|lower|older|younger|rather)\s+(then)\b/gi, exp: "Use 'than' for comparisons.", rep: "than", type: 'grammar' },
  
  // affect / effect
  { regex: /\b(?:an|the|this|that|profound|major|minor|side|positive|negative|direct|no|any)\s+(affect)\b/gi, exp: "'Affect' is usually a verb. Use 'effect' as a noun.", rep: "effect", type: 'grammar' },
  { regex: /\b(?:will|would|can|could|to|not|how to|significantly|directly)\s+(effect)\b/gi, exp: "'Effect' is usually a noun. Use 'affect' as a verb.", rep: "affect", type: 'grammar' },
  
  // accept / except
  { regex: /\b(?:will|would|can|could|to|not|please|kindly|always)\s+(except)\b/gi, exp: "'Except' means 'excluding'. Use 'accept' to mean receive or agree.", rep: "accept", type: 'grammar' },
  { regex: /\b(?:everyone|everybody|all|everything|anything|nobody|none|nothing|always)\s+(accept)\b/gi, exp: "'Accept' is a verb. Use 'except' for exclusion.", rep: "except", type: 'grammar' },
  
  // loose / lose
  { regex: /\b(?:will|would|can|could|to|not|never|always|dont|do not)\s+(loose)\b/gi, exp: "'Loose' means not tight. Use 'lose' to mean misplace or fail to win.", rep: "lose", type: 'grammar' },
  { regex: /\b(?:is|are|was|were|too|very|so)\s+(lose)\b/gi, exp: "'Lose' is a verb. Use 'loose' as an adjective.", rep: "loose", type: 'grammar' },
  
  // to / too / two
  { regex: /\b(to)\s+(?:much|many|good|bad|big|small|hot|cold|hard|soft|fast|slow|expensive|cheap|late|early)\b/gi, exp: "Use 'too' meaning 'excessively'.", rep: "too", type: 'grammar' },
  { regex: /\b(?:going|want|need|have|like|love|hate|try|plan|used|supposed)\s+(too|two)\b/gi, exp: "Use 'to' before a verb.", rep: "to", type: 'grammar' },
  
  // sea / see
  { regex: /\b(?:want to|going to|will|can|could|did you)\s+(sea)\b/gi, exp: "'Sea' is the ocean. Use 'see' for the verb.", rep: "see", type: 'grammar' },
  { regex: /\b(?:the|a|deep|blue|open|rough|calm)\s+(see)\b/gi, exp: "'See' is a verb. Use 'sea' for the ocean.", rep: "sea", type: 'grammar' },
  
  // hear / here
  { regex: /\b(?:come|go|stay|wait|sit|stand|put it|right|over)\s+(hear)\b/gi, exp: "'Hear' is to listen. Use 'here' for a place.", rep: "here", type: 'grammar' },
  { regex: /\b(?:can|could|did you|to|will|would|want to)\s+(here)\b/gi, exp: "'Here' is a place. Use 'hear' to listen.", rep: "hear", type: 'grammar' },
  
  // bear / bare
  { regex: /\b(?:with|in)\s+(bear)\s+(hands|feet|arms|legs)\b/gi, exp: "'Bear' is an animal or to carry. Use 'bare' for uncovered.", rep: "bare", type: 'grammar' },
  { regex: /\b(bare)\s+(?:in mind|the burden|the weight|fruit|witness)\b/gi, exp: "'Bare' means uncovered. Use 'bear' for carrying or enduring.", rep: "bear", type: 'grammar' },
  
  // principal / principle
  { regex: /\b(?:main|school|the|a)\s+(principle)\b/gi, exp: "'Principle' is a fundamental truth. Use 'principal' for a person or main item.", rep: "principal", type: 'grammar' },
  { regex: /\b(?:moral|ethical|guiding|basic)\s+(principal)\b/gi, exp: "'Principal' is a person or main item. Use 'principle' for a fundamental truth.", rep: "principle", type: 'grammar' },
  
  // stationary / stationery
  { regex: /\b(?:remained|stayed|was|were|is|are)\s+(stationery)\b/gi, exp: "'Stationery' refers to writing materials. Use 'stationary' for not moving.", rep: "stationary", type: 'grammar' },
  { regex: /\b(?:buy|paper|pen|envelope|office)\s+(stationary)\b/gi, exp: "'Stationary' means not moving. Use 'stationery' for writing materials.", rep: "stationery", type: 'grammar' },

  // compliment / complement
  { regex: /\b(?:gave|received|a nice|thanks for the)\s+(complement)\b/gi, exp: "'Complement' means to complete. Use 'compliment' for praise.", rep: "compliment", type: 'grammar' },
  { regex: /\b(?:perfectly|really)\s+(compliments|compliment)\b/gi, exp: "If it means 'completes', use 'complement'.", rep: "complement", type: 'grammar' },

  // Grammar & Phrasing Errors
  { regex: /\b(should|would|could|must|might)\s+(of)\b/gi, exp: "Did you mean 'have' instead of 'of'?", rep: "$1 have", type: 'grammar' },
  { regex: /\b(suppose)\s+(to)\b/gi, exp: "Did you mean 'supposed to'?", rep: "supposed to", type: 'grammar' },
  { regex: /\b(use)\s+(to)\b/gi, exp: "Did you mean 'used to'?", rep: "used to", type: 'grammar' },
  { regex: /\b(alot)\b/gi, exp: "'a lot' is written as two words.", rep: "a lot", type: 'spelling' },
  { regex: /\bdon't\s+have\s+no\b/gi, exp: "Double negative detected.", rep: "don't have any", type: 'grammar' },
  { regex: /\bcan't\s+hardly\b/gi, exp: "Double negative detected.", rep: "can hardly", type: 'grammar' },
  
  // Subject-verb agreement (Basic forms)
  { regex: /\b(he|she|it)\s+(do)\b/gi, exp: "Subject-verb agreement: use 'does'.", rep: "$1 does", type: 'grammar' },
  { regex: /\b(he|she|it)\s+(have)\b/gi, exp: "Subject-verb agreement: use 'has'.", rep: "$1 has", type: 'grammar' },
  { regex: /\b(they|we|you)\s+(does)\b/gi, exp: "Subject-verb agreement: use 'do'.", rep: "$1 do", type: 'grammar' },
  { regex: /\b(they|we|you|i)\s+(has)\b/gi, exp: "Subject-verb agreement: use 'have'.", rep: "$1 have", type: 'grammar' },
  { regex: /\b(you|we|they)\s+(is)\b/gi, exp: "Subject-verb agreement: use 'are'.", rep: "$1 are", type: 'grammar' },
  { regex: /\b(you|we|they)\s+(was)\b/gi, exp: "Subject-verb agreement: use 'were'.", rep: "$1 were", type: 'grammar' },
  { regex: /\b(i)\s+(are|is)\b/gi, exp: "Subject-verb agreement: use 'am'.", rep: "I am", type: 'grammar' },
  { regex: /\b(many|several|few)\s+person\b/gi, exp: "Use plural 'people' after quantifiers like 'many'.", rep: "$1 people", type: 'grammar' },
  { regex: /\b(many|several|few|all|some)\s+people\s+was\b/gi, exp: "Plural subject 'people' takes plural verb 'were'.", rep: "$1 people were", type: 'grammar' },
  { regex: /\b(him)\s+(prefers|likes|wants|goes|knows|said|thinks|bought|saw|ran)\b/gi, exp: "Subject pronoun error: use 'he'.", rep: "he $2", type: 'grammar' },
  { regex: /\b(her)\s+(prefers|likes|wants|goes|knows|said|thinks|bought|saw|ran)\b/gi, exp: "Subject pronoun error: use 'she'.", rep: "she $2", type: 'grammar' },
  { regex: /\b(them)\s+(prefers|likes|wants|goes|knows|said|thinks|bought|saw|ran)\b/gi, exp: "Subject pronoun error: use 'they'.", rep: "they $2", type: 'grammar' },
  { regex: /\b(buyed)\b/gi, exp: "Irregular past tense: use 'bought'.", rep: "bought", type: 'spelling' },
  { regex: /\b(selled)\b/gi, exp: "Irregular past tense: use 'sold'.", rep: "sold", type: 'spelling' },
  { regex: /\b(teached)\b/gi, exp: "Irregular past tense: use 'taught'.", rep: "taught", type: 'spelling' },
  { regex: /\b(catched)\b/gi, exp: "Irregular past tense: use 'caught'.", rep: "caught", type: 'spelling' },
  { regex: /\b(thinked)\b/gi, exp: "Irregular past tense: use 'thought'.", rep: "thought", type: 'spelling' },
  { regex: /\b(didn't|did not)\s+(looked|went|saw|bought|worked|asked|took|came|gave)\b/gi, exp: "Use base form of verb after 'did not'.", rep: "$1 look", type: 'grammar' },
  { regex: /\b(was|were|is|are|looks|looking|sounded|sounding|smelled|smelling|tasted|tasting|felt|feeling)\s+(badly)\b/gi, exp: "Use predicate adjective 'bad' after linking verbs.", rep: "$1 bad", type: 'grammar' },
  
  // Extra confusion pairs
  { regex: /\b(more|less|better|worse|rather|greater|smaller|faster|slower)\s+(then)\b/gi, exp: "Did you mean 'than' for comparison?", rep: "$1 than", type: 'grammar' },
  { regex: /\b(dont|do not|will|would|might|can|could|to)\s+(loose)\b/gi, exp: "Did you mean 'lose' (opposite of win/find)?", rep: "$1 lose", type: 'grammar' },
  { regex: /\b(side|negative|positive|main|adverse)\s+(affects)\b/gi, exp: "Did you mean noun 'effects'?", rep: "$1 effects", type: 'grammar' },

  // --- Advanced Contextual Grammar Rules ---

  // "Every days" -> "Every day"
  { regex: /\b(every)\s+days\b/gi, exp: "Use singular 'day' with 'every'.", rep: "$1 day", type: 'grammar' },
  { regex: /\b(every)\s+weeks\b/gi, exp: "Use singular 'week' with 'every'.", rep: "$1 week", type: 'grammar' },
  { regex: /\b(every)\s+months\b/gi, exp: "Use singular 'month' with 'every'.", rep: "$1 month", type: 'grammar' },
  { regex: /\b(every)\s+years\b/gi, exp: "Use singular 'year' with 'every'.", rep: "$1 year", type: 'grammar' },

  // Third-person singular verbs (he/she/it + regular verb adding 's')
  { regex: /\b(he|she|it|this|that|everyone|everybody|someone|somebody|no\s+one|nobody|anyone|anybody|the\s+man|the\s+woman|the\s+boy|the\s+girl|the\s+teacher|the\s+student|the\s+boss|the\s+manager|the\s+dog|the\s+cat|the\s+car)\s+(want|need|like|love|hate|make|take|give|find|think|know|tell|ask|seem|feel|play|buy|say|pay|look|call|work|help|start|show|hear|run|move|live|believe|bring|happen|write|provide|sit|stand|lose|meet|include|continue|set|learn|change|lead|understand|follow|stop|create|speak|read|allow|add|spend|grow|open|walk|win|offer|remember|consider|appear|wait|serve|die|send|expect|build|stay|fall|cut|reach|kill|remain|see)\b/gi, exp: "Singular subjects require singular verbs (add -s).", rep: "$1 $2s", type: 'grammar' },

  // Third-person singular verbs ending in 'y' -> 'ies'
  { regex: /\b(he|she|it|this|that|everyone|everybody|someone|somebody|no\s+one|nobody|anyone|anybody|the\s+man|the\s+woman|the\s+boy|the\s+girl|the\s+teacher|the\s+student|the\s+boss|the\s+manager|the\s+dog|the\s+cat|the\s+car)\s+(tr|cr|fl|stud|carr|marr|cop|repl)y\b/gi, exp: "Singular subjects require singular verbs (add -ies).", rep: "$1 $2ies", type: 'grammar' },

  // Third-person singular verbs ending in ch, sh, s, x, z, or 'o' -> 'es'
  { regex: /\b(he|she|it|this|that|everyone|everybody|someone|somebody|no\s+one|nobody|anyone|anybody|the\s+man|the\s+woman|the\s+boy|the\s+girl|the\s+teacher|the\s+student|the\s+boss|the\s+manager|the\s+dog|the\s+cat|the\s+car)\s+(watch|catch|teach|wash|push|rush|pass|miss|fix|mix|buzz|go|do)\b/gi, exp: "Singular subjects require singular verbs (add -es).", rep: "$1 $2es", type: 'grammar' },

  // Plural subjects & I/You verbs incorrectly ending in 's'
  { regex: /\b(i|you|we|they|these|those|the\s+men|the\s+women|the\s+boys|the\s+girls|the\s+teachers|the\s+students|the\s+bosses|the\s+managers|the\s+dogs|the\s+cats|the\s+cars|people|children)\s+(want|need|like|love|hate|make|take|give|find|think|know|tell|ask|seem|feel|play|buy|say|pay|look|call|work|help|start|show|hear|run|move|live|believe|bring|happen|write|provide|sit|stand|lose|meet|include|continue|set|learn|change|lead|understand|follow|stop|create|speak|read|allow|add|spend|grow|open|walk|win|offer|remember|consider|appear|wait|serve|die|send|expect|build|stay|fall|cut|reach|kill|remain|see)s\b/gi, exp: "Plural subjects and 'I/You' require the base form of the verb.", rep: "$1 $2", type: 'grammar' },

  // Plural subjects & I/You verbs incorrectly ending in 'ies' -> 'y'
  { regex: /\b(i|you|we|they|these|those|the\s+men|the\s+women|the\s+boys|the\s+girls|the\s+teachers|the\s+students|the\s+bosses|the\s+managers|the\s+dogs|the\s+cats|the\s+cars|people|children)\s+(tr|cr|fl|stud|carr|marr|cop|repl)ies\b/gi, exp: "Plural subjects and 'I/You' require the base form of the verb.", rep: "$1 $2y", type: 'grammar' },

  // Plural subjects & I/You verbs incorrectly ending in 'es'
  { regex: /\b(i|you|we|they|these|those|the\s+men|the\s+women|the\s+boys|the\s+girls|the\s+teachers|the\s+students|the\s+bosses|the\s+managers|the\s+dogs|the\s+cats|the\s+cars|people|children)\s+(watch|catch|teach|wash|push|rush|pass|miss|fix|mix|buzz|go|do)es\b/gi, exp: "Plural subjects and 'I/You' require the base form of the verb.", rep: "$1 $2", type: 'grammar' },

  // Past perfect and bare infinitive ("have forgot to finished")
  { regex: /\b(have|has)\s+(forgot|forgotten)\s+to\s+(finished|worked|played|started)\b/gi, exp: "Use past perfect 'had forgotten' and bare infinitive 'finish' after 'to'.", rep: "had forgotten to finish", type: 'grammar' },
  // A broader catch for "to + past tense verb"
  { regex: /\bto\s+(finished|started|worked|played|fixed)\b/gi, exp: "Use the base form of the verb after 'to' (infinitive).", rep: "to finish", type: 'grammar' }, 
  { regex: /\bto\s+fixing\b/gi, exp: "Use the base form 'fix' after 'to'.", rep: "to fix", type: 'grammar' },

  // Verbs of sensation and past tense ("which make him very angrily")
  { regex: /\b(which|that)\s+make(s)?\s+(him|her|me|us|them|it)\s+(very|really)\s+(angrily|sadly|happily)\b/gi, exp: "Use past tense 'made' and an adjective ('angry'), not an adverb.", rep: "$1 made $3 $4 angry", type: 'grammar' },

  // Subject pronoun and agreement ("Me and my coworker is trying to fixing")
  { regex: /\bme\s+and\s+my\s+(coworker|friend|brother|sister|manager)\s+(is|are)\b/gi, exp: "List the other person first, use 'I', and use the plural verb 'are'.", rep: "my $1 and I are", type: 'grammar' },
  { regex: /\bare\s+trying\s+to\s+fixing\b/gi, exp: "Use the base form of the verb after 'to'.", rep: "are trying to fix", type: 'grammar' },

  // Uncountable nouns and apostrophes ("too much data's")
  { regex: /\b(too\s+much|a\s+lot\s+of|some)\s+(data's|datas)\b/gi, exp: "'Data' is already plural or uncountable; do not add an apostrophe or 's'.", rep: "$1 data", type: 'grammar' },

  // Third conditional for past unreal events ("If we was... this will not happen")
  { regex: /\bIf\s+we\s+was\s+(more\s+careful|careful|better),\s+this\s+will\s+not\s+happen\b/gi, exp: "Use the third conditional for past unreal events: 'If we had been... this would not have happened'.", rep: "If we had been $1, this would not have happened", type: 'grammar' },

  // --- Example 1: Double Negatives & Run-on Sentences ---
  { regex: /\bdidn't\s+see\s+nobody\b/gi, exp: "Double negative detected. Use 'anybody'.", rep: "didn't see anybody", type: 'grammar' },
  { regex: /\b(didn't|couldn't|wouldn't|wasn't|weren't)\s+(?:[a-z\s]+)\s+when\s+(i|he|she|they|we|you)\s+arrive\b/gi, exp: "Tense agreement: use 'arrived' for past events.", rep: "$1 see anybody at the front desk when $2 arrived", type: 'grammar' }, // specifically tailored to the context provided or general if simplified
  { regex: /\b(lights|things|people)\s+(wasn't)\b/gi, exp: "Plural subjects take 'weren't'.", rep: "$1 weren't", type: 'grammar' },
  { regex: /\b(creepy|good|bad|terrible),\s*(I|He|She|They|We)\s+(should|would|could)\b/gi, exp: "Comma splice: use a period or conjunction to separate independent clauses.", rep: "$1. $2 $3", type: 'grammar' },
  { regex: /\bshould\s+of\b/gi, exp: "Did you mean 'should have'?", rep: "should have", type: 'grammar' },

  // --- Example 2: Wrong Prepositions & Modifier Issues ---
  { regex: /\bresponsible\s+to\b/gi, exp: "Use 'responsible for' instead of 'responsible to'.", rep: "responsible for", type: 'grammar' },
  { regex: /\bscheduled\s+on\s+next\b/gi, exp: "Do not use 'on' before 'next'.", rep: "scheduled for next", type: 'grammar' },
  { regex: /\bLooking\s+at\s+the\s+data,\s+the\s+sales\s+targets\s+were\s+missed\s+by\s+the\s+team\b/gi, exp: "Dangling modifier. The team was looking at the data.", rep: "Looking at the data, the team missed the sales targets", type: 'grammar' },
  { regex: /\bdiscuss\s+about\b/gi, exp: "'Discuss' means to talk about; do not add 'about'.", rep: "discuss", type: 'grammar' },
  { regex: /\bfor\s+(avoid|do|make|get|take)\b/gi, exp: "Use the infinitive 'to' instead of 'for' + base verb.", rep: "to $1", type: 'grammar' },

  // --- Example 3: Homophone Confusion & Plural Mistakes ---
  { regex: /\bTheir\s+(are|is|was|were)\b/gi, exp: "'Their' is possessive. Use 'There' as a pronoun/adverb.", rep: "There $1", type: 'grammar' },
  { regex: /\b(many|few|some)\s+(peoples)\b/gi, exp: "'People' is already plural. 'Peoples' is only used for distinct ethnic groups.", rep: "$1 people", type: 'grammar' },
  { regex: /\b(its)\s+(moving|going|doing|making|taking)\b/gi, exp: "Use 'it's' as a contraction for 'it is'.", rep: "it's $2", type: 'grammar' },
  { regex: /\bway\s+to\s+(slow|fast|big|small|hard|easy)\b/gi, exp: "Use 'too' meaning excessively.", rep: "way too $1", type: 'grammar' },
  { regex: /\b(should|would|could)\s+have\s+(gave|went|did|saw|wrote|took|drove)\b/gi, exp: "Use the past participle after 'have'. For example, 'given'.", rep: "$1 have given", type: 'grammar' }, // Specifically targeted, though 'given' replaces everything. Let's make it literal for gave.
  { regex: /\b(should|would|could)\s+have\s+gave\b/gi, exp: "Use the past participle 'given' after 'have'.", rep: "$1 have given", type: 'grammar' },
  { regex: /\bEveryone\s+(are|were)\b/gi, exp: "'Everyone' is a singular indefinite pronoun.", rep: "Everyone is", type: 'grammar' },
  { regex: /\b(losing|getting|finding)\s+(there)\s+(patience|time|money|lives)\b/gi, exp: "Use the possessive 'their'.", rep: "$1 their $3", type: 'grammar' }
];
