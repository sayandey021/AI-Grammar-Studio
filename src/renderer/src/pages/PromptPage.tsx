import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Download, 
  Wand2, 
  RotateCcw, 
  AlertCircle,
  FileText,
  BookOpen,
  Feather,
  Mail,
  RefreshCw,
  Square
} from 'lucide-react';

interface PromptPageProps {
  onNavigateToSettings: () => void;
  onSendToEditor?: (text: string) => void;
  settings?: any;
}

const PRESET_PROMPTS = [
  { 
    id: 'story', 
    label: 'Story Starter', 
    icon: BookOpen, 
    prefix: 'write a story starting with: '
  },
  { 
    id: 'paragraph', 
    label: 'Descriptive Paragraph', 
    icon: FileText, 
    prefix: 'write a descriptive paragraph about: '
  },
  { 
    id: 'poem', 
    label: 'Poem', 
    icon: Feather, 
    prefix: 'write a poem about: '
  },
  { 
    id: 'essay', 
    label: 'Essay Outline', 
    icon: Wand2, 
    prefix: 'write an essay outline for: '
  },
  { 
    id: 'email', 
    label: 'Email Draft', 
    icon: Mail, 
    prefix: 'draft a professional email about: '
  },
  { 
    id: 'blog', 
    label: 'Blog Post', 
    icon: Sparkles, 
    prefix: 'write a blog post about: '
  }
];

const PromptPage: React.FC<PromptPageProps> = ({ onNavigateToSettings, onSendToEditor, settings }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const [modelInstalled, setModelInstalled] = useState<boolean | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const outputEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  // Auto-scroll to bottom as output streams
  useEffect(() => {
    if (loading && response) {
      outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, loading]);

  useEffect(() => {
    checkModelStatus();

    const unsubs: (() => void)[] = [];

    if (window.api?.onPromptStreamChunk) {
      unsubs.push(window.api.onPromptStreamChunk((chunk: string) => {
        setResponse(prev => prev + chunk);
      }));
    }

    if ((window.api as any)?.onPromptDone) {
      unsubs.push((window.api as any).onPromptDone((fullText: string) => {
        setResponse(prev => prev || fullText);
        setLoading(false);
        if (startTimeRef.current) {
          setExecutionTime(Number(((performance.now() - startTimeRef.current) / 1000).toFixed(2)));
        }
      }));
    }

    if ((window.api as any)?.onPromptError) {
      unsubs.push((window.api as any).onPromptError((err: string) => {
        if (err === 'Generation stopped by user.') {
          setLoading(false);
          if (startTimeRef.current) {
            setExecutionTime(Number(((performance.now() - startTimeRef.current) / 1000).toFixed(2)));
          }
        } else {
          setError(err || 'Generation failed.');
          setLoading(false);
        }
      }));
    }

    return () => unsubs.forEach(fn => fn());
  }, [settings?.activeCreativeModelId, settings?.activeModelId]);

  const checkModelStatus = async () => {
    if (window.api?.getModelStatus) {
      try {
        let modelId = settings?.activeCreativeModelId;
        if (!modelId || modelId.startsWith('flan-t5') || modelId === 'qwen-0.5b') {
          modelId = 'qwen3-0.6b';
        }
        const status = await window.api.getModelStatus(modelId);
        setModelInstalled(status.downloaded);
      } catch (e) {
        setModelInstalled(false);
      }
    }
  };

  const handleSelectPreset = (prefix: string) => {
    if (prompt.startsWith(prefix)) return;
    
    // Replace existing prefix or prepend
    const existingPrefix = PRESET_PROMPTS.find(p => prompt.startsWith(p.prefix));
    if (existingPrefix) {
      const content = prompt.slice(existingPrefix.prefix.length);
      setPrompt(prefix + content);
    } else {
      setPrompt(prefix + prompt);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading || modelInstalled === false) return;

    setLoading(true);
    setError(null);
    setResponse('');
    setExecutionTime(null);
    const startTime = performance.now();
    startTimeRef.current = startTime;

    try {
      if (window.api?.generateAiPrompt) {
        await window.api.generateAiPrompt(prompt, { isThinkingEnabled });
      } else {
        throw new Error('API not available');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate response.');
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!loading) return;
    if (window.api?.abortAiPrompt) {
      await window.api.abortAiPrompt();
    }
  };

  const getCleanOutput = (raw: string): string => {
    if (!raw) return '';
    let text = raw;
    if (text.includes('</think>')) {
      text = text.replace(/<think>[\s\S]*?<\/think>/g, '').split('</think>').pop() || '';
    } else if (text.includes('<think>')) {
      text = text.replace(/<think>[\s\S]*$/g, '');
    }
    return text.trim();
  };

  const handleCopy = () => {
    const textToCopy = getCleanOutput(response) || response;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setPrompt('');
    setResponse('');
    setError(null);
    setExecutionTime(null);
  };

  return (
    <div className="studio-layout-container">
      
      {/* Sleek Top Bar */}
      <div className="studio-header">
        <div className="studio-title-group">
          <div className="studio-icon-box">
            <Feather size={22} />
          </div>
          <div>
            <h2 className="studio-title">Creative Studio</h2>
            <p className="studio-subtitle">Immersive AI writing canvas</p>
          </div>
        </div>

        <div className="model-status-indicator">
          {modelInstalled === null ? (
            <><span className="status-dot downloading"></span> Checking...</>
          ) : modelInstalled ? (
            <><span className="status-dot installed"></span> Local AI Ready</>
          ) : (
            <button className="btn-sm-action btn-outline-danger" onClick={onNavigateToSettings}>
              Model Required
            </button>
          )}
        </div>
      </div>

      {/* Main Output Canvas */}
      <div className="studio-output-area">
        {modelInstalled === false && !response && !loading && (
          <div className="prompt-alert-banner" style={{ maxWidth: '850px', width: '100%', margin: '0 auto 24px auto' }}>
            <AlertCircle size={20} />
            <div className="alert-content">
              <strong>Local AI Model Not Installed</strong>
              <p>To generate AI text offline, please download a Creative AI model in Settings.</p>
            </div>
            {onNavigateToSettings && (
              <button className="primary-button alert-btn" onClick={onNavigateToSettings}>
                <Download size={16} /> Go to Settings
              </button>
            )}
          </div>
        )}

        {!response && !loading && !error ? (
          <div className="studio-empty-state">
            <Sparkles size={48} className="studio-empty-icon" />
            <h3>What would you like to write today?</h3>
            <p>Select a preset below or type any prompt into the command bar.</p>
          </div>
        ) : (
          <div className="studio-output-card">
            {error ? (
              <div className="error-state" style={{ padding: '40px 0' }}>
                <AlertCircle size={24} />
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className="studio-response-text" style={{ display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    let hasThinkTag = response.includes('<think>');
                    const hasCloseTag = response.includes('</think>');
                    const isThinkingModel = settings?.activeCreativeModelId === 'qwen3-0.6b' || settings?.activeCreativeModelId === 'qwen3-1.7b';

                    // Prefilled prompt omits the opening <think> tag if streamed. If we see a close tag, we know it was thinking.
                    if (!hasThinkTag && hasCloseTag) {
                      hasThinkTag = true;
                    }
                    
                    // While actively loading, if it's a thinking model and thinking is enabled, display the thinking box until closing tag arrives
                    const isCurrentlyThinking = loading && isThinkingEnabled && isThinkingModel && !hasCloseTag;
                    
                    if (hasThinkTag && hasCloseTag) {
                      let thinkingText = '';
                      let restText = '';
                      
                      if (response.includes('<think>')) {
                        const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
                        thinkingText = thinkMatch ? thinkMatch[1].trim() : '';
                        restText = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                      } else {
                        const parts = response.split('</think>');
                        thinkingText = parts[0].trim();
                        restText = parts.slice(1).join('</think>').trim();
                      }
                      
                      return (
                        <>
                          {isThinkingEnabled && thinkingText && (
                            <div className="thinking-block" style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #60a5fa', borderRadius: '0 8px 8px 0', marginBottom: '16px', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                              <div style={{ marginBottom: '6px', fontWeight: 600, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', fontStyle: 'normal' }}>
                                <Wand2 size={13} /> Thinking Process
                              </div>
                              {thinkingText}
                            </div>
                          )}
                          <div style={{ whiteSpace: 'pre-wrap' }}>{restText}</div>
                        </>
                      );
                    } else if (hasThinkTag || isCurrentlyThinking) {
                      const thinkingText = response.replace('<think>', '').trim();
                      return (
                        <>
                          {isThinkingEnabled && (
                            <div className="thinking-block" style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #60a5fa', borderRadius: '0 8px 8px 0', marginBottom: '16px', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                              <div style={{ marginBottom: '6px', fontWeight: 600, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', fontStyle: 'normal' }}>
                                <Wand2 size={13} /> Thinking Process...
                              </div>
                              {thinkingText || 'Reasoning through prompt...'}
                            </div>
                          )}
                        </>
                      );
                    }
                    return <div style={{ whiteSpace: 'pre-wrap' }}>{response}</div>;
                  })()}
                  {loading && (
                    <span className="streaming-cursor" style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '16px',
                      marginLeft: '4px',
                      backgroundColor: '#34d399',
                      borderRadius: '2px',
                      animation: 'blink 0.8s infinite'
                    }} />
                  )}
                </div>
                
                {/* Actions when done generating */}
                {!loading && response && (
                  <div className="studio-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {executionTime !== null && (
                        <span className="time-badge" style={{ fontSize: '12px', color: '#64748b', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                          Generated in {executionTime}s
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {onSendToEditor && (
                        <button 
                          className="btn-sm-action btn-outline-subtle"
                          onClick={() => onSendToEditor(getCleanOutput(response) || response)}
                        >
                          <FileText size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }}/> 
                          Send to Editor
                        </button>
                      )}
                      <button 
                        className="btn-sm-action btn-creative-glow"
                        onClick={handleCopy}
                      >
                        {copied ? <Check size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }}/> : <Copy size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }}/>}
                        {copied ? 'Copied' : 'Copy Text'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div ref={outputEndRef} />
      </div>

      {/* Floating Command Bar */}
      <div className="studio-floating-bottom">
        <div className="studio-command-wrapper">
          
          {/* Preset Chips */}
          <div className="studio-presets-row">
            {PRESET_PROMPTS.map((preset) => {
              const Icon = preset.icon;
              const isActive = prompt.startsWith(preset.prefix);
              return (
                <button
                  key={preset.id}
                  className={`studio-preset-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset.prefix)}
                >
                  <Icon size={14} />
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Frosted Input Box */}
          <div className="studio-input-box">
            <textarea
              className="studio-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the AI to write something..."
              rows={prompt.split('\n').length > 3 ? 4 : 2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            <div className="studio-input-footer">
              <div className="studio-hint">
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send
                {(prompt || response || error) && (
                  <button 
                    onClick={handleClear} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RotateCcw size={12}/> Clear
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {(settings?.activeCreativeModelId === 'qwen3-0.6b' || settings?.activeCreativeModelId === 'qwen3-1.7b') && (
                  <button 
                    className="studio-send-btn"
                    onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                    style={{ 
                      background: isThinkingEnabled ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      border: `1px solid ${isThinkingEnabled ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: isThinkingEnabled ? '#60a5fa' : '#94a3b8'
                    }}
                  >
                    <Wand2 size={16} /> Thinking {isThinkingEnabled ? 'On' : 'Off'}
                  </button>
                )}
                {loading ? (
                  <button 
                    className="studio-send-btn stop-btn"
                    onClick={handleStop}
                  >
                    <Square size={14} fill="currentColor" /> Stop
                  </button>
                ) : (
                  <button 
                    className="studio-send-btn"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || modelInstalled === false}
                  >
                    <Send size={16} /> Send
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PromptPage;
