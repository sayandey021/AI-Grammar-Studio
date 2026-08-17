import React, { useState, useRef, useEffect } from 'react';
import { PenTool, CheckCircle, AlertTriangle, Info, Zap, Sparkles, Feather, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

interface EditorPageProps {
  settings: any;
  pendingText?: string | null;
  onClearPendingText?: () => void;
  onNavigateToSettings?: () => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ settings, pendingText, onClearPendingText, onNavigateToSettings }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'quick' | 'ai'>('quick');
  const [tone, setTone] = useState('professional');
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [rewritePreview, setRewritePreview] = useState<string | null>(null);
  const [modelInstalled, setModelInstalled] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (pendingText) {
      setText(pendingText);
      setSuggestions([]);
      setRewritePreview(null);
      if (onClearPendingText) {
        onClearPendingText();
      }
    }
  }, [pendingText, onClearPendingText]);

  useEffect(() => {
    const checkModelStatus = async () => {
      if (window.api?.getModelStatus) {
        try {
          const modelId = settings?.activeModelId || 'flan-t5-base';
          const status = await window.api.getModelStatus(modelId);
          setModelInstalled(status.downloaded);
        } catch (e) {
          setModelInstalled(false);
        }
      }
    };
    checkModelStatus();
  }, [settings?.activeModelId]);

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClear = () => {
    setText('');
    setSuggestions([]);
    setRewritePreview(null);
  };

  const handleCheck = async () => {
    if (!text.trim()) return;
    setIsSidebarOpen(true);
    setIsChecking(true);
    setSuggestions([]);
    setRewritePreview(null);
    try {
      const result = await window.api.checkGrammar(text, mode, tone);
      setSuggestions(result.suggestions);
      if (result.rewritePreview) {
        setRewritePreview(result.rewritePreview);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlights = () => {
    if (!text || suggestions.length === 0) return text;

    const sorted = [...suggestions].sort((a, b) => a.start - b.start);
    const nonOverlapping: any[] = [];
    let lastEnd = 0;
    for (const s of sorted) {
      if (s.start >= lastEnd) {
        nonOverlapping.push(s);
        lastEnd = s.end;
      }
    }

    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    nonOverlapping.forEach((s, idx) => {
      if (s.start > currentIndex) {
        elements.push(text.substring(currentIndex, s.start));
      }
      const typeClass = s.type || 'grammar';
      elements.push(
        <mark key={`${s.id}-${idx}`} className={`pro-highlight-tag ${typeClass}`}>
          {text.substring(s.start, s.end)}
        </mark>
      );
      currentIndex = s.end;
    });

    if (currentIndex < text.length) {
      elements.push(text.substring(currentIndex));
    }

    return elements;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'spelling': return <AlertTriangle size={16} color="#ef4444" />;
      case 'grammar': return <Info size={16} color="#3b82f6" />;
      case 'style': return <Sparkles size={16} color="#a855f7" />;
      case 'punctuation': return <AlertTriangle size={16} color="#f59e0b" />;
      default: return <Info size={16} color="#10b981" />;
    }
  };

  return (
    <div className="pro-editor-layout">
      {/* Main Canvas */}
      <div className="pro-editor-main">
        {/* Sleek Header */}
        <div className="pro-editor-header">
          <div className="pro-header-title">
            <div className="pro-icon-box">
              <PenTool size={20} />
            </div>
            <div>
              <h2>Grammar Studio</h2>
              <p>Type or paste your text for instant intelligent analysis</p>
            </div>
          </div>

          <div className="pro-editor-controls">
            <div className="pro-mode-toggle-group">
              <button
                className={`pro-mode-btn ${mode === 'quick' ? 'active' : ''}`}
                onClick={() => setMode('quick')}
              >
                <Zap size={14} /> Quick Mode
              </button>
              <button
                className={`pro-mode-btn ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
              >
                <Sparkles size={14} /> AI Deep Engine
              </button>
            </div>



            <button className="pro-check-btn" onClick={handleCheck} disabled={isChecking || !text.trim()}>
              {isChecking ? 'Checking...' : 'Analyze Text'}
            </button>

            {(text || suggestions.length > 0 || rewritePreview) && (
              <button
                className="secondary-button"
                onClick={handleClear}
                style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '0.88rem' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Editor Card */}
        <div className="pro-editor-card">
          <div className="pro-editor-container">
            <div className="pro-editor-backdrop" ref={backdropRef}>
              <div className="pro-editor-highlights">
                {renderHighlights()}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              className="pro-editor-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={handleScroll}
              placeholder="Start typing your masterpiece here..."
              spellCheck={false}
            />
          </div>

          <div className="pro-editor-footer">
            <div className="pro-word-count">
              <Feather size={14} />
              {text.trim() ? text.trim().split(/\s+/).length : 0} words
            </div>
            <div className="pro-status-indicator" title={modelInstalled ? "Local AI model is active" : "Local AI model is not installed"}>
              {modelInstalled ? (
                <><span className="status-dot installed"></span> Local Model Ready</>
              ) : (
                <><span className="status-dot missing"></span> Offline Mode Only</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar for Suggestions */}
      <div className={`pro-suggestions-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <button
          className="pro-sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="pro-sidebar-content" style={{ opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          <h3 className="pro-sidebar-title">
            <CheckCircle size={18} /> Analysis Results
          </h3>

          <div className="pro-suggestions-list">
            {isChecking ? (
              <div className="pro-sidebar-loading">
                <Loader2 size={32} className="pro-spin-animation" />
                <p className="pro-pulse-text">Analyzing your text...</p>
              </div>
            ) : suggestions.length === 0 && !rewritePreview ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '60px', fontSize: '14px' }}>
                <Sparkles size={32} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
                <p>Run an analysis to see suggestions here.</p>
              </div>
            ) : (
              <>

                {rewritePreview && (
                  <div className="pro-rewrite-card">
                    <h4><Sparkles size={14} /> AI Rewrite Suggestion</h4>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{rewritePreview}</p>
                    {!modelInstalled ? (
                      <button className="pro-apply-btn" onClick={() => onNavigateToSettings?.()}>
                        Go to Settings
                      </button>
                    ) : (rewritePreview.startsWith('⚠️') || rewritePreview.startsWith('Failed') || rewritePreview.startsWith('✨ Perfect!')) ? null : (
                      <button className="pro-apply-btn" onClick={() => {
                        setText(rewritePreview);
                        setSuggestions(suggestions.filter(s => !(s.replacements?.length === 1 && s.replacements[0] === rewritePreview)));
                        setRewritePreview(null);
                      }}>
                        Apply Rewrite
                      </button>
                    )}
                  </div>
                )}

                {suggestions.filter(s => !(s.replacements?.length === 1 && s.replacements[0] === rewritePreview)).map(s => (
                  <div key={s.id} className={`pro-suggestion-card ${s.type || 'grammar'}`}>
                    <div className="pro-suggestion-header">
                      {getIconForType(s.type)}
                      <span className="pro-suggestion-type">{s.type || 'Grammar'}</span>
                    </div>
                    <div className="pro-suggestion-body">
                      <p className="pro-suggestion-msg">
                        {s.issue && <strong style={{ color: 'var(--text-primary)', marginRight: '6px' }}>"{s.issue}"</strong>}
                        {s.message || s.explanation}
                      </p>
                      {s.replacements && s.replacements.length > 0 && (
                        <div className="pro-replacements">
                          {s.replacements.map((r: string, i: number) => (
                            <button
                              key={i}
                              className="pro-replace-btn"
                              onClick={() => {
                                const newText = text.substring(0, s.start) + r + text.substring(s.end);
                                setText(newText);
                                setSuggestions(suggestions.filter(sug => sug.id !== s.id));
                              }}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
