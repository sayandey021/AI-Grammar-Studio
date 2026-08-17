import React, { useState } from 'react';

interface AnalysisPageProps {
  settings?: any;
}

const AnalysisPage: React.FC<AnalysisPageProps> = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
    setActiveAction(null);
  };

  const handleAnalyze = async (action: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setActiveAction(action);
    setError(null);
    setResult(null);

    try {
      const response = await (window as any).api.analyzeGrammar(text, action);
      if (response.type === 'error') {
        setError(response.data);
      } else {
        setResult(response);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedText(content);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getPosDetails = (item: any) => {
    const tags = item.tags || [];
    const category = item.category || 'Unknown';
    const explanation = item.explanation || '';
    
    let group = 'Other';
    let color = '#9aa0a6';
    let bgColor = 'rgba(154, 160, 166, 0.12)';
    let borderColor = 'rgba(154, 160, 166, 0.3)';

    if (tags.includes('Noun') || tags.includes('ProperNoun') || tags.includes('Pronoun')) {
      group = tags.includes('Pronoun') ? 'Pronouns' : 'Nouns';
      color = tags.includes('Pronoun') ? '#f06292' : '#1a73e8';
      bgColor = tags.includes('Pronoun') ? 'rgba(240, 98, 146, 0.12)' : 'rgba(26, 115, 232, 0.12)';
      borderColor = tags.includes('Pronoun') ? 'rgba(240, 98, 146, 0.3)' : 'rgba(26, 115, 232, 0.3)';
    } else if (tags.includes('Verb') || tags.includes('Auxiliary')) {
      group = 'Verbs'; color = '#ea4335'; bgColor = 'rgba(234, 67, 53, 0.12)'; borderColor = 'rgba(234, 67, 53, 0.3)';
    } else if (tags.includes('Adjective')) {
      group = 'Adjectives'; color = '#f9ab00'; bgColor = 'rgba(249, 171, 0, 0.15)'; borderColor = 'rgba(249, 171, 0, 0.35)';
    } else if (tags.includes('Adverb')) {
      group = 'Adverbs'; color = '#a142f4'; bgColor = 'rgba(161, 66, 244, 0.12)'; borderColor = 'rgba(161, 66, 244, 0.3)';
    } else if (tags.includes('Preposition')) {
      group = 'Prepositions'; color = '#00897b'; bgColor = 'rgba(0, 137, 123, 0.12)'; borderColor = 'rgba(0, 137, 123, 0.3)';
    } else if (tags.includes('Conjunction')) {
      group = 'Conjunctions'; color = '#e67c73'; bgColor = 'rgba(230, 124, 115, 0.12)'; borderColor = 'rgba(230, 124, 115, 0.3)';
    } else if (tags.includes('Determiner') || tags.includes('Article')) {
      group = 'Determiners'; color = '#3f51b5'; bgColor = 'rgba(63, 81, 181, 0.12)'; borderColor = 'rgba(63, 81, 181, 0.3)';
    } else if (tags.includes('QuestionWord')) {
      group = 'Question Words'; color = '#00acc1'; bgColor = 'rgba(0, 172, 193, 0.12)'; borderColor = 'rgba(0, 172, 193, 0.3)';
    } else if (tags.includes('Value')) {
      group = 'Values / Numbers'; color = '#8d6e63'; bgColor = 'rgba(141, 110, 99, 0.12)'; borderColor = 'rgba(141, 110, 99, 0.3)';
    } else if (tags.includes('Expression')) {
      group = 'Interjections'; color = '#ff9800'; bgColor = 'rgba(255, 152, 0, 0.12)'; borderColor = 'rgba(255, 152, 0, 0.3)';
    }

    return { category, explanation, group, color, bgColor, borderColor };
  };

  const getStructuredForms = (item: any, sentenceType: string) => {
    let currentKey = 'positive';
    if (sentenceType.includes('Interrogative Negative')) {
      currentKey = 'interrogativeNegative';
    } else if (sentenceType.includes('Interrogative')) {
      currentKey = 'interrogative';
    } else if (sentenceType.includes('Negative')) {
      currentKey = 'negative';
    }

    const formsMap: Record<string, { label: string; formula: string; color: string }> = {
      positive: {
        label: 'Positive (Affirmative)',
        formula: item.positiveStructure,
        color: '#34a853'
      },
      negative: {
        label: 'Negative',
        formula: item.negativeStructure,
        color: '#ea4335'
      },
      interrogative: {
        label: 'Interrogative (Question)',
        formula: item.interrogativeStructure,
        color: '#1a73e8'
      },
      interrogativeNegative: {
        label: 'Interrogative Negative',
        formula: item.interrogativeNegativeStructure,
        color: '#a142f4'
      }
    };

    const currentForm = formsMap[currentKey];
    const otherForms = Object.keys(formsMap)
      .filter(k => k !== currentKey)
      .map(k => formsMap[k]);

    return { currentForm, otherForms };
  };

  const getClauseColor = (type: string) => {
    if (type.includes('Independent Clause (Main')) {
      return { color: '#0b57d0', bg: 'rgba(11, 87, 208, 0.1)', border: 'rgba(11, 87, 208, 0.3)' };
    }
    if (type.includes('Independent Clause (Coordinated')) {
      return { color: '#34a853', bg: 'rgba(52, 168, 83, 0.1)', border: 'rgba(52, 168, 83, 0.3)' };
    }
    if (type.includes('Dependent Clause (Adverbial')) {
      return { color: '#b3261e', bg: 'rgba(179, 38, 30, 0.1)', border: 'rgba(179, 38, 30, 0.3)' };
    }
    if (type.includes('Dependent Clause (Relative')) {
      return { color: '#8d6e63', bg: 'rgba(141, 110, 99, 0.1)', border: 'rgba(141, 110, 99, 0.3)' };
    }
    if (type.includes('Dependent Clause (Noun')) {
      return { color: '#673ab7', bg: 'rgba(103, 58, 183, 0.1)', border: 'rgba(103, 58, 183, 0.3)' };
    }
    return { color: '#3c4043', bg: 'rgba(60, 64, 67, 0.1)', border: 'rgba(60, 64, 67, 0.3)' };
  };

  const getSentenceClassificationDefinition = (classification: string) => {
    if (classification === 'Simple Sentence') return 'Contains one independent clause and expresses a single complete thought.';
    if (classification === 'Compound Sentence') return 'Contains two or more independent clauses joined together, usually by a conjunction.';
    if (classification === 'Complex Sentence') return 'Contains one independent clause and at least one dependent (subordinate) clause.';
    if (classification === 'Compound-Complex Sentence') return 'Contains two or more independent clauses and at least one dependent clause.';
    return '';
  };

  const renderResult = () => {
    if (error) {
      return <div className="analysis-error">⚠️ {error}</div>;
    }
    
    if (!result) return null;

    // VOICE CHANGE RENDERER
    if (result.type === 'voice') {
      const converted = result.convertedText || result.data || text;
      const originalVoice = result.originalVoice || 'Detected Voice';
      const convertedVoice = result.convertedVoice || 'Converted Voice';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Voice Change Transformation</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="type-badge grammar" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                {originalVoice} ➔ {convertedVoice}
              </span>
              {result.isAiEnhanced && (
                <span className="badge-ready" style={{ fontSize: '0.82rem', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #aecbfa' }}>
                  ✨ AI Refined
                </span>
              )}
            </div>
          </div>

          {/* Transformed Result Card */}
          <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--accent-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Converted Sentence ({convertedVoice})
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="secondary-button"
                  style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                  onClick={() => handleCopy(converted)}
                >
                  {copiedText === converted ? '✓ Copied' : '📋 Copy'}
                </button>
                <button
                  className="secondary-button"
                  style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                  onClick={() => setText(converted)}
                >
                  ↩ Use as Input
                </button>
              </div>
            </div>

            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              "{converted}"
            </p>

            {result.explanation && (
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                💡 <strong>Explanation:</strong> {result.explanation}
              </p>
            )}

            {result.exceptionsApplied && result.exceptionsApplied.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e37400', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Grammar & Exception Rules Applied
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.exceptionsApplied.map((rule: string, idx: number) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        backgroundColor: 'rgba(227, 116, 0, 0.1)',
                        color: '#e37400',
                        border: '1px solid rgba(227, 116, 0, 0.3)'
                      }}
                    >
                      ⚡ {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Syntactic Role Breakdown */}
          {(result.subject || result.verb || result.object) && (
            <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Syntactic Roles Breakdown</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {result.subject && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.08)', border: '1px solid rgba(26, 115, 232, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase' }}>Subject / Agent</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{result.subject}</div>
                  </div>
                )}
                {result.verb && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(234, 67, 53, 0.08)', border: '1px solid rgba(234, 67, 53, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea4335', textTransform: 'uppercase' }}>Verb Phrase</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{result.verb}</div>
                  </div>
                )}
                {result.object && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(52, 168, 83, 0.08)', border: '1px solid rgba(52, 168, 83, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34a853', textTransform: 'uppercase' }}>Object / Recipient</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{result.object}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // NARRATION RENDERER
    if (result.type === 'narration') {
      const converted = result.convertedText || result.data || text;
      const originalSpeech = result.originalSpeech || 'Detected Speech';
      const convertedSpeech = result.convertedSpeech || 'Converted Speech';

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Narration Transformation (Direct ↔ Indirect)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="type-badge grammar" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                {originalSpeech} ➔ {convertedSpeech}
              </span>
              {result.isAiEnhanced && (
                <span className="badge-ready" style={{ fontSize: '0.82rem', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #aecbfa' }}>
                  ✨ AI Refined
                </span>
              )}
            </div>
          </div>

          {/* Transformed Result Card */}
          <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid #a142f4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a142f4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Converted Sentence ({convertedSpeech})
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="secondary-button"
                  style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                  onClick={() => handleCopy(converted)}
                >
                  {copiedText === converted ? '✓ Copied' : '📋 Copy'}
                </button>
                <button
                  className="secondary-button"
                  style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                  onClick={() => setText(converted)}
                >
                  ↩ Use as Input
                </button>
              </div>
            </div>

            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {converted}
            </p>

            {result.explanation && (
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                💡 <strong>Explanation:</strong> {result.explanation}
              </p>
            )}
          </div>

          {/* Rules Applied Checklist */}
          {result.rulesApplied && result.rulesApplied.length > 0 && (
            <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Narration Transformation Rules Applied</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.rulesApplied.map((rule: string, rIdx: number) => (
                  <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    <span style={{ color: '#34a853', fontWeight: 'bold' }}>✓</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // CLAUSE ANALYSIS RENDERER
    if (result.type === 'clause') {
      const sentences = result.data || [];

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Clause Structure & Sentence Parsing</h3>
            <span className="type-badge grammar" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              {sentences.length} Sentence{sentences.length > 1 ? 's' : ''} Analyzed
            </span>
          </div>

          {sentences.map((sent: any, sIdx: number) => (
            <div key={sIdx} className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sentence Classification Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    "{sent.sentenceText}"
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      backgroundColor: 'rgba(11, 87, 208, 0.12)',
                      color: 'var(--accent-color)',
                      border: '1px solid rgba(11, 87, 208, 0.3)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      {sent.classification}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {sent.clauseCount} Clause{sent.clauseCount > 1 ? 's' : ''} ({sent.independentCount} Independent, {sent.dependentCount} Dependent)
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-hover)', padding: '6px 12px', borderRadius: '6px', alignSelf: 'flex-start' }}>
                  💡 {getSentenceClassificationDefinition(sent.classification)}
                </div>
              </div>

              {/* Clause Cards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Identified Clauses:</h4>
                {sent.clauses.map((clause: any, cIdx: number) => {
                  const styleInfo = getClauseColor(clause.type);

                  return (
                    <div key={cIdx} style={{
                      backgroundColor: 'var(--bg-hover)',
                      border: `1px solid ${styleInfo.border}`,
                      borderLeft: `4px solid ${styleInfo.color}`,
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{
                          backgroundColor: styleInfo.bg,
                          color: styleInfo.color,
                          padding: '2px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {clause.type}
                        </span>
                        {clause.connector && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            🔗 Connector: <code style={{ color: styleInfo.color, fontWeight: 700 }}>"{clause.connector}"</code>
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        "{clause.text}"
                      </div>

                      {/* Subject, Verb, Predicate Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          <strong>Subject:</strong> {clause.subject}
                        </span>
                        <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          <strong>Verb:</strong> {clause.verbPhrase}
                        </span>
                        {clause.predicate && clause.predicate !== 'N/A' && (
                          <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                            <strong>Predicate:</strong> {clause.predicate}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                        💡 {clause.role}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (result.type === 'pos') {
      const posItems = result.data.map((item: any) => ({
        ...item,
        posInfo: getPosDetails(item)
      }));

      const counts: Record<string, { count: number; color: string; bgColor: string }> = {};
      const groupedWords: Record<string, { words: string[]; color: string; bgColor: string }> = {};

      posItems.forEach((item: any) => {
        const { group, color, bgColor } = item.posInfo;
        if (!counts[group]) {
          counts[group] = { count: 0, color, bgColor };
          groupedWords[group] = { words: [], color, bgColor };
        }
        counts[group].count += 1;
        if (!groupedWords[group].words.includes(item.text)) {
          groupedWords[group].words.push(item.text);
        }
      });

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0 }}>Parts of Speech Analysis</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {posItems.length} Total Words Analyzed
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(counts).map(([group, info]) => (
                <div key={group} style={{
                  backgroundColor: info.bgColor,
                  color: info.color,
                  border: `1px solid ${info.color}`,
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{group}:</span>
                  <span style={{
                    backgroundColor: info.color,
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '0.75rem'
                  }}>{info.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Syntactic Flow & Tags</h4>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
              {posItems.map((item: any, idx: number) => {
                const { category, explanation, color, bgColor, borderColor } = item.posInfo;

                return (
                  <div key={idx} style={{
                    backgroundColor: 'var(--bg-hover)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '100px',
                    maxWidth: '180px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.text}
                    </span>
                    <span style={{
                      backgroundColor: bgColor,
                      color: color,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {category}
                    </span>
                    {explanation && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.9, lineHeight: 1.3 }}>
                        {explanation}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Categorized Words Breakdown</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {Object.entries(groupedWords).map(([group, info]) => (
                <div key={group} style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: `1px solid var(--border-color)`,
                  borderLeft: `4px solid ${info.color}`,
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: info.color }}>
                    {group} ({info.words.length})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {info.words.map((w: string, wIdx: number) => (
                      <span key={wIdx} style={{
                        backgroundColor: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500
                      }}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (result.type === 'degree') {
      const transformations = result.transformations || [];

      if (transformations.length === 0) {
        return (
          <div className="analysis-card">
            <h4>Degree Transformation</h4>
            <p className="model-note">{result.explanation || 'No gradable adjective or supported comparison structure detected in the text.'}</p>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Degree Transformation</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="type-badge grammar" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                Identified: {result.degreeType} ({result.originalDegree})
              </span>
              {result.isAiEnhanced && (
                <span className="badge-ready" style={{ fontSize: '0.82rem', backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #aecbfa' }}>
                  ✨ AI Refined
                </span>
              )}
            </div>
          </div>

          {/* Transformed Result Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transformations.map((item: any, idx: number) => (
              <div key={idx} className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: `4px solid ${item.degree === 'Positive' ? '#1a73e8' : item.degree === 'Comparative' ? '#34a853' : '#ea4335'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Converted to {item.degree} Degree
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="secondary-button"
                      style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                      onClick={() => handleCopy(item.text)}
                    >
                      {copiedText === item.text ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button
                      className="secondary-button"
                      style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                      onClick={() => setText(item.text)}
                    >
                      ↩ Use as Input
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                  "{item.text}"
                </p>
              </div>
            ))}
          </div>

          {result.explanation && (
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              💡 <strong>Explanation:</strong> {result.explanation}
            </p>
          )}
        </div>
      );
    }

    if (result.type === 'tense') {
      const tenses = result.data || [];
      const sentenceType = result.sentenceType || 'Positive (Affirmative)';

      if (tenses.length === 0) {
        return (
          <div className="analysis-card">
            <h4>Tense Structure</h4>
            <p className="model-note">No active verb phrases detected in the text.</p>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Tense & Sentence Structure</h3>
            <span className="type-badge grammar" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              Detected Sentence Type: {sentenceType}
            </span>
          </div>

          {tenses.map((item: any, idx: number) => {
            const { currentForm, otherForms } = getStructuredForms(item, sentenceType);

            return (
              <div key={idx} className="analysis-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                    Verb Phrase: "{item.verbPhrase}"
                  </div>
                  <span className="badge-ready" style={{ fontSize: '0.85rem' }}>
                    {item.name}
                  </span>
                </div>

                {item.sentenceText && (
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic', backgroundColor: 'var(--bg-hover)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                    "{item.sentenceText}"
                  </div>
                )}

                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Definition:</strong> {item.definition}
                </div>

                <div style={{
                  backgroundColor: 'rgba(52, 168, 83, 0.08)',
                  border: '1px solid rgba(52, 168, 83, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34a853', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.voice === 'Passive' ? 'Passive' : 'Active'} Sentence Structure ({currentForm.label})
                  </div>
                  <code style={{ fontSize: '1rem', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {currentForm.formula}
                  </code>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Other Sentence Formats for {item.name}:
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {otherForms.map((form: any, fIdx: number) => (
                      <div key={fIdx} style={{
                        backgroundColor: 'var(--bg-hover)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: form.color }}>
                          • {form.label}
                        </div>
                        <code style={{ fontSize: '0.86rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {form.formula}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const isParagraph = text.trim().split(/[.?!]+[\s\n]+/).filter(s => s.trim().length > 0).length > 1 || text.includes('\n');

  return (
    <div className="pro-analysis-dashboard">
      {/* Sidebar Controls */}
      <div className="pro-analysis-sidebar">
        <div className="pro-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Deep Analysis</h2>
            <p>Transform and inspect sentence structures</p>
          </div>
          {(text || result || error) && (
            <button 
              className="secondary-button" 
              onClick={handleClear}
              style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px' }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="pro-analysis-input-box">
          <textarea
            className="pro-analysis-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter a sentence or paragraph to analyze..."
          />
        </div>

        <div className="pro-analysis-controls">
          <div className="pro-analysis-group">
            <span className="pro-group-label">Transformations</span>
            <div className="pro-action-grid">
              <button 
                className={`pro-action-btn ${activeAction === 'voice' && isProcessing ? 'processing' : ''} ${activeAction === 'voice' ? 'active' : ''}`}
                onClick={() => handleAnalyze('voice')}
                disabled={!text.trim() || isProcessing || isParagraph}
                title={isParagraph ? "Voice change is only available for single sentences." : ""}
              >
                <span className="pro-btn-icon">🔄</span> Voice
              </button>
              <button 
                className={`pro-action-btn ${activeAction === 'narration' && isProcessing ? 'processing' : ''} ${activeAction === 'narration' ? 'active' : ''}`}
                onClick={() => handleAnalyze('narration')}
                disabled={!text.trim() || isProcessing || isParagraph}
                title={isParagraph ? "Narration is only available for single sentences." : ""}
              >
                <span className="pro-btn-icon">💬</span> Narration
              </button>
              <button 
                className={`pro-action-btn ${activeAction === 'degree' && isProcessing ? 'processing' : ''} ${activeAction === 'degree' ? 'active' : ''}`}
                onClick={() => handleAnalyze('degree')}
                disabled={!text.trim() || isProcessing || isParagraph}
                title={isParagraph ? "Degree transformation is only available for single sentences." : ""}
              >
                <span className="pro-btn-icon">📈</span> Degrees
              </button>
            </div>
          </div>

          <div className="pro-analysis-group">
            <span className="pro-group-label">Grammar & Structure</span>
            <div className="pro-action-grid">
              <button 
                className={`pro-action-btn ${activeAction === 'clause' && isProcessing ? 'processing' : ''} ${activeAction === 'clause' ? 'active' : ''}`}
                onClick={() => handleAnalyze('clause')}
                disabled={!text.trim() || isProcessing}
              >
                <span className="pro-btn-icon">🧩</span> Clauses
              </button>
              <button 
                className={`pro-action-btn ${activeAction === 'pos' && isProcessing ? 'processing' : ''} ${activeAction === 'pos' ? 'active' : ''}`}
                onClick={() => handleAnalyze('pos')}
                disabled={!text.trim() || isProcessing}
              >
                <span className="pro-btn-icon">🏷️</span> POS
              </button>
              <button 
                className={`pro-action-btn ${activeAction === 'tense' && isProcessing ? 'processing' : ''} ${activeAction === 'tense' ? 'active' : ''}`}
                onClick={() => handleAnalyze('tense')}
                disabled={!text.trim() || isProcessing}
              >
                <span className="pro-btn-icon">⏱️</span> Tense
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Canvas */}
      <div className="pro-analysis-results-area">
        {!text && !result && !isProcessing && (
          <div className="pro-analysis-empty">
            <span className="empty-icon">📊</span>
            <h3>Waiting for Input</h3>
            <p>Type text and select an analysis mode from the sidebar.</p>
          </div>
        )}
        {isProcessing && (
          <div className="pro-analysis-empty">
            <div className="pro-spinner"></div>
            <h3>Analyzing Text...</h3>
          </div>
        )}
        {!isProcessing && renderResult()}
      </div>
    </div>
  );
};

export default AnalysisPage;

