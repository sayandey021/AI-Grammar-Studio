import React, { useState, useEffect, useRef } from 'react';
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Trash2,
  Clipboard,
  Sparkles,
  PenTool,
  Download,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Zap,
  CornerDownLeft,
  Search,
  ChevronDown
} from 'lucide-react';

interface TranslationPageProps {
  settings: any;
  onSendToEditor?: (text: string) => void;
  onNavigateToSettings?: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  nllbCode: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', nllbCode: 'eng_Latn' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', nllbCode: 'spa_Latn' },
  { code: 'fr', name: 'French', nativeName: 'Français', nllbCode: 'fra_Latn' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', nllbCode: 'deu_Latn' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', nllbCode: 'hin_Deva' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', nllbCode: 'zho_Hans' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文', nllbCode: 'zho_Hant' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', nllbCode: 'jpn_Jpan' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', nllbCode: 'arb_Arab' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', nllbCode: 'rus_Cyrl' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', nllbCode: 'por_Latn' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', nllbCode: 'ita_Latn' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', nllbCode: 'nld_Latn' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', nllbCode: 'kor_Hang' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', nllbCode: 'tur_Latn' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', nllbCode: 'pol_Latn' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', nllbCode: 'ukr_Cyrl' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', nllbCode: 'vie_Latn' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', nllbCode: 'ind_Latn' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', nllbCode: 'tha_Thai' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', nllbCode: 'ben_Beng' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', nllbCode: 'tam_Taml' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', nllbCode: 'tel_Telu' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', nllbCode: 'mar_Deva' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', nllbCode: 'urd_Arab' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', nllbCode: 'pes_Arab' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', nllbCode: 'swe_Latn' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', nllbCode: 'ces_Latn' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', nllbCode: 'ron_Latn' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', nllbCode: 'ell_Grek' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', nllbCode: 'hun_Latn' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', nllbCode: 'dan_Latn' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', nllbCode: 'fin_Latn' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', nllbCode: 'nob_Latn' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', nllbCode: 'heb_Hebr' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', nllbCode: 'zsm_Latn' },
  { code: 'fil', name: 'Filipino / Tagalog', nativeName: 'Tagalog', nllbCode: 'tgl_Latn' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', nllbCode: 'swh_Latn' }
];

const POPULAR_LANG_CODES = ['en', 'es', 'fr', 'de', 'hi'];

const SAMPLE_TEXTS: Record<string, string> = {
  en: 'Artificial intelligence and offline privacy work hand-in-hand to empower global communication without compromise.',
  es: 'La inteligencia artificial y la privacidad fuera de línea trabajan de la mano para potenciar la comunicación global.',
  fr: "L'intelligence artificielle et la confidentialité hors ligne fonctionnent main dans la main pour faciliter la communication mondiale.",
  de: 'Künstliche Intelligenz und Offline-Datenschutz arbeiten Hand in Hand, um die globale Kommunikation zu stärken.',
  hi: 'आर्टिफिशियल इंटेलिजेंस और ऑफलाइन गोपनीयता एक साथ मिलकर वैश्विक संचार को सशक्त बनाते हैं।'
};

const TranslationPage: React.FC<TranslationPageProps> = ({ settings, onSendToEditor }) => {
  const [sourceLang, setSourceLang] = useState<string>('en');
  const [targetLang, setTargetLang] = useState<string>('es');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [sentToEditor, setSentToEditor] = useState<boolean>(false);

  // Model status & download
  const [modelStatus, setModelStatus] = useState<any>({ downloaded: false, downloading: false, progress: 0 });
  const [isDownloadingModel, setIsDownloadingModel] = useState<boolean>(false);

  // Dropdown states
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');

  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  const modelId = 'nllb-200-distilled-600m';

  // Load and subscribe to Model Status changes
  useEffect(() => {
    const checkStatus = async () => {
      if ((window as any).api?.getModelStatus) {
        try {
          const st = await (window as any).api.getModelStatus(modelId);
          setModelStatus(st || { downloaded: false, downloading: false, progress: 0 });
        } catch {
          setModelStatus({ downloaded: false, downloading: false, progress: 0 });
        }
      }
    };
    checkStatus();

    // Check status periodically while active
    const interval = setInterval(checkStatus, 2500);

    let unsubProgress: any = null;
    if ((window as any).api?.onModelProgress) {
      unsubProgress = (window as any).api.onModelProgress((mId: string, progress: number) => {
        if (mId === modelId) {
          setModelStatus((prev: any) => ({
            ...prev,
            downloading: progress > 0 && progress < 100,
            downloaded: progress >= 100,
            progress
          }));
          if (progress >= 100 || progress <= 0) {
            setIsDownloadingModel(false);
            checkStatus();
          }
        }
      });
    }

    let unsubDeleted: any = null;
    if ((window as any).api?.onModelDeleted) {
      unsubDeleted = (window as any).api.onModelDeleted((mId: string) => {
        if (mId === modelId) {
          setModelStatus({ downloaded: false, downloading: false, progress: 0 });
          setIsDownloadingModel(false);
          checkStatus();
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (unsubProgress) unsubProgress();
      if (unsubDeleted) unsubDeleted();
    };
  }, [settings]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(e.target as Node)) {
        setTargetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleDownloadModel = async () => {
    setIsDownloadingModel(true);
    setError(null);
    try {
      setModelStatus((prev: any) => ({ ...prev, downloading: true, progress: 0 }));
      await (window as any).api?.downloadModel(modelId);
      const st = await (window as any).api?.getModelStatus(modelId);
      setModelStatus(st);
    } catch (err: any) {
      setError(`Download failed: ${err?.message || 'Check network connection'}`);
      setModelStatus((prev: any) => ({ ...prev, downloading: false, progress: 0 }));
    } finally {
      setIsDownloadingModel(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    if (!modelStatus.downloaded) {
      setError('Please download the Meta NLLB-200 translation model first.');
      return;
    }

    if (sourceLang === targetLang) {
      setOutputText(inputText);
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const res = await (window as any).api?.translateText({
        text: inputText,
        sourceLang,
        targetLang,
        modelId
      });

      if (res?.translation) {
        setOutputText(res.translation);
      } else {
        setError('Translation returned empty output.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err?.message || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    const oldSource = sourceLang;
    const oldTarget = targetLang;
    setSourceLang(oldTarget);
    setTargetLang(oldSource);

    // Swap texts if output exists
    if (outputText.trim()) {
      const oldInput = inputText;
      setInputText(outputText);
      setOutputText(oldInput);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
      }
    } catch (e) { }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError(null);
  };

  const handleSendToEditorAction = () => {
    if (!outputText || !onSendToEditor) return;
    onSendToEditor(outputText);
    setSentToEditor(true);
    setTimeout(() => setSentToEditor(false), 2500);
  };

  const handleLoadSample = () => {
    const sample = SAMPLE_TEXTS[sourceLang] || SAMPLE_TEXTS['en'];
    setInputText(sample);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTranslate();
    }
  };

  const currentSourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const currentTargetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[1];

  const filteredSourceLanguages = SUPPORTED_LANGUAGES.filter(
    l => l.name.toLowerCase().includes(searchSource.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchSource.toLowerCase()) ||
      l.code.toLowerCase().includes(searchSource.toLowerCase())
  );

  const filteredTargetLanguages = SUPPORTED_LANGUAGES.filter(
    l => l.name.toLowerCase().includes(searchTarget.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchTarget.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTarget.toLowerCase())
  );

  return (
    <div className="page-content translation-page">
      {/* Header Banner */}
      <div className="translation-header-row">
        <div className="translation-title-group">
          <div className="translation-icon-badge">
            <Languages size={22} color="#6366f1" />
          </div>
          <div>
            <h1 className="translation-main-title">Offline Neural Translator</h1>
            <p className="translation-sub-title">
              100% Private, On-Device Machine Translation • 35+ Languages
            </p>
          </div>
        </div>

        <div
          className={`translation-badge-pill ${modelStatus.downloaded ? 'online' : 'offline'}`}
          title={modelStatus.downloaded ? 'Local Neural Model Online & Ready' : 'Local Model Offline - Weights Not Downloaded'}
        >
          <span className={`translation-status-dot ${modelStatus.downloaded ? 'online' : 'offline'}`} />
          {modelStatus.downloaded ? (
            <>
              <Zap size={13} className="pill-status-icon" />
              <span>Local AI Online</span>
            </>
          ) : (
            <>
              <AlertCircle size={13} className="pill-status-icon" />
              <span>Local AI Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Model Missing Prompt Card if not downloaded */}
      {!modelStatus.downloaded && (
        <div className="translation-model-card">
          <div className="model-card-left">
            <div className="model-icon-box">
              <Cpu size={24} color="#818cf8" />
            </div>
            <div>
              <h3>Neural Translation Model Required</h3>
              <p>
                Download <strong>Meta NLLB-200 (600M Q4 Quantized, ~310 MB)</strong> once to enable completely offline translation across 200+ languages directly on your device.
              </p>
            </div>
          </div>

          <div className="model-card-right">
            {modelStatus.downloading ? (
              <div className="model-downloading-box">
                <div className="download-progress-label">
                  <span>Downloading weights...</span>
                  <strong>{modelStatus.progress}%</strong>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${modelStatus.progress}%` }} />
                </div>
              </div>
            ) : (
              <button
                className="primary-button translation-download-btn"
                onClick={handleDownloadModel}
                disabled={isDownloadingModel}
              >
                <Download size={16} />
                <span>Download Model (~310 MB)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="translation-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Translation Container */}
      <div className="translation-main-workspace">
        {/* Language Bar */}
        <div className="translation-lang-bar">
          {/* Source Lang Picker */}
          <div className="lang-selector-wrap" ref={sourceDropdownRef}>
            <div className="quick-lang-pills">
              {POPULAR_LANG_CODES.map(c => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === c);
                if (!lang) return null;
                return (
                  <button
                    key={c}
                    className={`lang-pill ${sourceLang === c ? 'active' : ''}`}
                    onClick={() => setSourceLang(c)}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>

            <div className="dropdown-trigger-box">
              <button
                className={`lang-dropdown-btn ${!POPULAR_LANG_CODES.includes(sourceLang) ? 'active-custom' : ''}`}
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                title="Select from 35+ languages"
              >
                <span>
                  {!POPULAR_LANG_CODES.includes(sourceLang)
                    ? currentSourceLangObj.name
                    : 'More'}
                </span>
                <ChevronDown size={14} className={sourceDropdownOpen ? 'rotate-180' : ''} />
              </button>

              {sourceDropdownOpen && (
                <div className="lang-dropdown-menu">
                  <div className="lang-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search 35+ languages..."
                      value={searchSource}
                      onChange={e => setSearchSource(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="lang-options-scroll">
                    {filteredSourceLanguages.map(lang => (
                      <div
                        key={lang.code}
                        className={`lang-option-row ${sourceLang === lang.code ? 'selected' : ''}`}
                        onClick={() => {
                          setSourceLang(lang.code);
                          setSourceDropdownOpen(false);
                          setSearchSource('');
                        }}
                      >
                        <span className="lang-opt-name">{lang.name}</span>
                        <span className="lang-opt-native">{lang.nativeName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <button
            className="lang-swap-btn"
            onClick={handleSwapLanguages}
            title="Swap Languages (and text)"
          >
            <ArrowLeftRight size={17} />
          </button>

          {/* Target Lang Picker */}
          <div className="lang-selector-wrap target-wrap" ref={targetDropdownRef}>
            <div className="quick-lang-pills">
              {['es', 'fr', 'de', 'hi', 'en'].map(c => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === c);
                if (!lang) return null;
                return (
                  <button
                    key={c}
                    className={`lang-pill ${targetLang === c ? 'active' : ''}`}
                    onClick={() => setTargetLang(c)}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>

            <div className="dropdown-trigger-box">
              <button
                className={`lang-dropdown-btn ${!['es', 'fr', 'de', 'hi', 'en'].includes(targetLang) ? 'active-custom' : ''}`}
                onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                title="Select from 35+ languages"
              >
                <span>
                  {!['es', 'fr', 'de', 'hi', 'en'].includes(targetLang)
                    ? currentTargetLangObj.name
                    : 'More'}
                </span>
                <ChevronDown size={14} className={targetDropdownOpen ? 'rotate-180' : ''} />
              </button>

              {targetDropdownOpen && (
                <div className="lang-dropdown-menu right-aligned">
                  <div className="lang-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search 35+ languages..."
                      value={searchTarget}
                      onChange={e => setSearchTarget(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="lang-options-scroll">
                    {filteredTargetLanguages.map(lang => (
                      <div
                        key={lang.code}
                        className={`lang-option-row ${targetLang === lang.code ? 'selected' : ''}`}
                        onClick={() => {
                          setTargetLang(lang.code);
                          setTargetDropdownOpen(false);
                          setSearchTarget('');
                        }}
                      >
                        <span className="lang-opt-name">{lang.name}</span>
                        <span className="lang-opt-native">{lang.nativeName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dual Panes */}
        <div className="translation-dual-panes">
          {/* Source Pane */}
          <div className="translation-pane source-pane">
            <div className="pane-header">
              <div className="pane-lang-tag">
                <span>{currentSourceLangObj.name}</span>
                <span className="char-count-tag">
                  {inputText.length} chars • {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <div className="pane-tools">
                <button className="tool-btn" onClick={handleLoadSample} title="Load Sample Text">
                  <Sparkles size={14} />
                  <span>Sample</span>
                </button>
                <button className="tool-btn" onClick={handlePaste} title="Paste from Clipboard">
                  <Clipboard size={14} />
                  <span>Paste</span>
                </button>
                {inputText && (
                  <button className="tool-btn danger" onClick={handleClear} title="Clear Text">
                    <Trash2 size={14} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pane-textarea-wrap">
              <textarea
                className="translation-textarea"
                placeholder={`Type or paste text in ${currentSourceLangObj.name} to translate (Ctrl + Enter to translate)...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="pane-footer">
              <span className="keyboard-hint">
                <CornerDownLeft size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Press <strong>Ctrl + Enter</strong> to translate
              </span>
              <button
                className="primary-button translate-action-btn"
                onClick={handleTranslate}
                disabled={isTranslating || !inputText.trim()}
              >
                {isTranslating ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Languages size={16} />
                    <span>Translate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Target / Output Pane */}
          <div className="translation-pane target-pane">
            <div className="pane-header">
              <div className="pane-lang-tag">
                <span>{currentTargetLangObj.name}</span>
                {outputText && (
                  <span className="char-count-tag">
                    {outputText.length} chars • {outputText.trim() ? outputText.trim().split(/\s+/).length : 0} words
                  </span>
                )}
              </div>
              <div className="pane-tools">
                {outputText && (
                  <>
                    <button
                      className="tool-btn success"
                      onClick={handleSendToEditorAction}
                      title="Open and check this translated text in the Grammar Editor"
                    >
                      {sentToEditor ? <Check size={14} /> : <PenTool size={14} />}
                      <span>{sentToEditor ? 'Sent to Editor!' : 'Open in Editor'}</span>
                    </button>
                    <button
                      className="tool-btn"
                      onClick={handleCopy}
                      title="Copy Translation"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pane-textarea-wrap output-wrap">
              {isTranslating ? (
                <div className="translation-loading-overlay">
                  <div className="loading-pulse-ring" />
                  <p>Neural model generating translation...</p>
                </div>
              ) : outputText ? (
                <div className="translation-output-content">{outputText}</div>
              ) : (
                <div className="translation-empty-placeholder">
                  <Languages size={40} strokeWidth={1.2} />
                  <p>Translation will appear here in real-time</p>
                  <span>Select target language and click Translate</span>
                </div>
              )}
            </div>

            <div className="pane-footer target-footer">
              <span className="target-model-signature">
                Powered by  Neural Engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationPage;
