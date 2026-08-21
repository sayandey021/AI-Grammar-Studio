import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  WifiOff,
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  FileText,
  Download,
  Info,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Layers,
  BarChart3,
  X,
  Cpu
} from 'lucide-react';
import ReportModal from '../components/ReportModal';

interface DetectorPageProps {
  settings: any;
}

const SAMPLE_AI_TEXT = `In today's fast-paced digital world, artificial intelligence plays a crucial role in transforming various industries. Furthermore, it is worth noting that machine learning models provide innovative solutions to complex problems. As we navigate the complexities of modern technology, it stands as a testament to human ingenuity. In conclusion, unlocking the potential of these tools fosters a sense of progress across global communities.`;

const SAMPLE_HUMAN_TEXT = `I spent yesterday morning fixing an odd squeak under my car's dashboard. Turns out, a small plastic clip had snapped loose after six years of bumpy backroad commuting. After rummaging through my toolbox for some zip ties and electrical tape, the noise was finally gone. What a relief! Now I can finally drive without that annoying rattle.`;

const DetectorPage: React.FC<DetectorPageProps> = ({ settings }) => {
  const [text, setText] = useState('');
  const [onlineMode, setOnlineMode] = useState(false);
  const [referenceText, setReferenceText] = useState('');
  const [referenceFileName, setReferenceFileName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Detector neural model status & download state
  const [activeModelStatus, setActiveModelStatus] = useState<any>({ downloaded: false, downloading: false, progress: 0 });
  const [isDownloadingModel, setIsDownloadingModel] = useState<boolean>(false);

  const activeDetectorModelId = settings?.activeDetectorModelId || 'tmr-ai-detector';

  useEffect(() => {
    const checkModel = async () => {
      if ((window as any).api?.getModelStatus) {
        const st = await (window as any).api.getModelStatus(activeDetectorModelId);
        setActiveModelStatus(st || { downloaded: false, downloading: false, progress: 0 });
      }
    };
    checkModel();

    let unsubscribe: any = null;
    if ((window as any).api?.onModelProgress) {
      unsubscribe = (window as any).api.onModelProgress((mId: string, progress: number) => {
        if (mId === activeDetectorModelId) {
          setActiveModelStatus((prev: any) => ({
            ...prev,
            downloading: progress < 100,
            downloaded: progress >= 100,
            progress
          }));
          if (progress >= 100) {
            setIsDownloadingModel(false);
          }
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeDetectorModelId]);

  const handleDownloadDetectorModel = async () => {
    setIsDownloadingModel(true);
    try {
      setActiveModelStatus((prev: any) => ({ ...prev, downloading: true, progress: 0 }));
      await (window as any).api?.downloadModel(activeDetectorModelId);
      const st = await (window as any).api?.getModelStatus(activeDetectorModelId);
      setActiveModelStatus(st);
    } catch (err) {
      console.error('Failed to download detector model:', err);
    } finally {
      setIsDownloadingModel(false);
    }
  };

  const handleScan = async () => {
    if (!text.trim()) return;
    setIsScanning(true);
    setError(null);
    setSelectedSentence(null);

    try {
      const res = await (window as any).api?.detectPlagiarismAi({
        text,
        onlineMode,
        referenceText,
      });
      setResult(res);
      if (res?.sentences?.length > 0) {
        setSelectedSentence(res.sentences[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to analyze document.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleLoadReferenceFile = async () => {
    try {
      const fileRes = await (window as any).api?.readReferenceFile();
      if (fileRes?.success && fileRes.content) {
        setReferenceText(fileRes.content);
        setReferenceFileName(fileRes.fileName || 'Reference Doc');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleClearReference = () => {
    setReferenceText('');
    setReferenceFileName(null);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setError(null);
    setSelectedSentence(null);
  };

  const getScoreColor = (score: number, inverse: boolean = false) => {
    // Normal: High is good (green), Low is bad (red)
    // Inverse: High is bad (red), Low is good (green)
    const effective = inverse ? 100 - score : score;
    if (effective >= 75) return '#10b981'; // green
    if (effective >= 45) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="detector-page-container">
      {/* Top Banner Header */}
      <div className="detector-header">
        <div className="detector-title-section">
          <div className="detector-icon-wrapper">
            <ShieldCheck size={26} className="detector-header-icon" />
          </div>
          <div>
            <h1 className="detector-main-title">Plagiarism & AI Content Detector</h1>
            <p className="detector-subtitle">
              Verify content originality, detect AI signatures, and generate certified reports.
            </p>
          </div>
        </div>

        {/* Online / Offline Mode Toggle */}
        <div className="detector-mode-controls">
          <div
            className={`detector-mode-badge ${onlineMode ? 'online' : 'offline'}`}
            title={onlineMode ? "Web matching is active" : "100% offline - No network requests"}
          >
            {onlineMode ? <Globe size={15} /> : <WifiOff size={15} />}
            <span>{onlineMode ? 'Online Mode' : 'Offline Mode'}</span>
          </div>

          <label className="detector-toggle-switch" title="Toggle between Offline-Only and Online Web Plagiarism Search">
            <input
              type="checkbox"
              checked={onlineMode}
              onChange={(e) => setOnlineMode(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="detector-workspace">
        {/* Left Side: Input & Reference Controls */}
        <div className="detector-input-panel">
          <div className="detector-panel-header">
            <div className="detector-counts">
              <span>{wordCount} words</span> • <span>{charCount} characters</span>
            </div>
            <div className="detector-quick-actions">
              <button
                className="action-link-btn"
                onClick={() => setText(SAMPLE_AI_TEXT)}
                title="Load sample AI generated paragraph"
              >
                Sample AI
              </button>
              <button
                className="action-link-btn"
                onClick={() => setText(SAMPLE_HUMAN_TEXT)}
                title="Load sample human written paragraph"
              >
                Sample Human
              </button>
              {(text || result) && (
                <button className="action-link-btn danger" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="detector-textarea-wrap">
            <textarea
              className="detector-textarea"
              placeholder="Paste or type text to inspect for AI content and originality..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Reference File Pill (Offline Comparison) */}
          <div className="detector-reference-bar">
            <button
              className="detector-ref-btn"
              onClick={handleLoadReferenceFile}
              title="Compare against a local document (.txt, .md, .docx)"
            >
              <Upload size={14} />
              <span>{referenceFileName ? 'Change Reference Doc' : 'Add Reference Document (Offline Compare)'}</span>
            </button>

            {referenceFileName && (
              <div className="detector-ref-pill">
                <FileCheck size={13} color="#10b981" />
                <span className="ref-name">{referenceFileName}</span>
                <button className="ref-clear-btn" onClick={handleClearReference} title="Remove reference document">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            className={`detector-scan-btn ${isScanning ? 'scanning' : ''}`}
            onClick={handleScan}
            disabled={!text.trim() || isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 size={18} className="spin-animation" />
                <span>Analyzing Patterns & Entropy...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Scan Document</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Visual Analysis Dashboard */}
        <div className="detector-results-panel">
          {error && (
            <div className="detector-error-box">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!result && !isScanning && !error && (
            <div className="detector-empty-placeholder">
              <div className="empty-icon-shield">
                <ShieldCheck size={48} style={{ opacity: 0.3 }} />
              </div>
              <h3>Ready to Scan</h3>
              <p>
                Enter text on the left and click <strong>Scan Document</strong> to compute perplexity,
                burstiness, and originality metrics.
              </p>
              <div className="empty-features-hint">
                <div className="hint-item">
                  <span className="hint-dot green"></span>
                  <span>Perplexity & Burstiness NLP</span>
                </div>
                <div className="hint-item">
                  <span className="hint-dot indigo"></span>
                  <span>Sentence-by-sentence heatmap</span>
                </div>
                <div className="hint-item">
                  <span className="hint-dot amber"></span>
                  <span>Exportable PDF/HTML Audit Report</span>
                </div>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="detector-scanning-card">
              <Loader2 size={44} className="spin-animation scan-loader" />
              <h3>Evaluating Linguistic Signatures</h3>
              <p className="scan-step-text">Checking word surprisal, sentence length variance, and n-gram shingles...</p>
            </div>
          )}

          {result && !isScanning && (
            <div className="detector-results-content">
              {/* Informational Tip: Show after analysis when running without deep neural model */}
              {!activeModelStatus.downloaded && (
                <div className="detector-model-tip-banner">
                  <div className="model-tip-left">
                    <div className="model-tip-icon">
                      <Cpu size={18} color="#f59e0b" />
                    </div>
                    <div className="model-tip-content">
                      <h4>Analyzed via Fast Statistical NLP Engine</h4>
                      <p>
                        Analysis performed using offline perplexity, entropy, and burstiness heuristics. For <strong>deeper sentence-level neural probabilities</strong> and higher accuracy, download a local AI Detector model (~125 MB).
                      </p>
                    </div>
                  </div>

                  <div className="model-tip-right">
                    {activeModelStatus.downloading ? (
                      <div className="model-tip-progress-box">
                        <div className="model-tip-progress-label">
                          <span>Downloading weights...</span>
                          <strong>{activeModelStatus.progress}%</strong>
                        </div>
                        <div className="model-tip-track">
                          <div className="model-tip-fill" style={{ width: `${activeModelStatus.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        className="model-tip-download-btn"
                        onClick={handleDownloadDetectorModel}
                        disabled={isDownloadingModel}
                      >
                        <Download size={14} />
                        <span>Download Neural Model (~125 MB)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Score Dials Bar */}
              <div className="detector-score-cards-grid">
                {/* 1. Originality */}
                <div className="detector-dial-card">
                  <div className="dial-value" style={{ color: getScoreColor(result.overallOriginalityScore, false) }}>
                    {result.overallOriginalityScore}%
                  </div>
                  <div className="dial-label">Originality</div>
                  <div className="dial-sub">
                    {result.overallOriginalityScore >= 80 ? 'High Uniqueness' : 'Matches Detected'}
                  </div>
                </div>

                {/* 2. AI Content */}
                <div className="detector-dial-card">
                  <div className="dial-value" style={{ color: getScoreColor(result.overallAiScore, true) }}>
                    {result.overallAiScore}%
                  </div>
                  <div className="dial-label">AI Probability</div>
                  <div className="dial-sub">{result.classification}</div>
                </div>

                {/* 3. Plagiarism Risk */}
                <div className="detector-dial-card">
                  <div className="dial-value" style={{ color: getScoreColor(result.overallPlagiarismScore, true) }}>
                    {result.overallPlagiarismScore}%
                  </div>
                  <div className="dial-label">Plagiarism Risk</div>
                  <div className="dial-sub">
                    {result.isOnlineMode ? 'Web Verified' : 'Corpus Verified'}
                  </div>
                </div>
              </div>

              {result.neuralModelUsed && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  color: '#fbbf24',
                  fontWeight: 600
                }}>
                  <Cpu size={16} />
                  <span>Powered by Local Neural Network: <strong>{result.neuralModelUsed}</strong></span>
                </div>
              )}

              {/* Statistical Metrics Row */}
              <div className="detector-stat-bar">
                <div className="stat-item" title="Sentence length variation (High = Human, Low = AI)">
                  <span className="stat-name">Burstiness</span>
                  <span className="stat-val">{result.metrics?.burstinessScore}</span>
                </div>
                <div className="stat-item" title="Average vocabulary surprisal">
                  <span className="stat-name">Avg Perplexity</span>
                  <span className="stat-val">{result.metrics?.perplexityScore}</span>
                </div>
                <div className="stat-item" title="Vocabulary diversity (Type-Token Ratio)">
                  <span className="stat-name">Lexical Diversity</span>
                  <span className="stat-val">{Math.round((result.metrics?.lexicalDiversity || 0) * 100)}%</span>
                </div>
                <div className="stat-item" title="Flesch-Kincaid Reading Grade">
                  <span className="stat-name">Reading Level</span>
                  <span className="stat-val">Grade {result.metrics?.readingGradeLevel}</span>
                </div>
              </div>

              {/* Interactive Heatmap Section */}
              <div className="detector-heatmap-section">
                <div className="heatmap-header">
                  <h3>Interactive Sentence Heatmap</h3>
                  <div className="heatmap-legend">
                    <span className="legend-tag tag-human">Human</span>
                    <span className="legend-tag tag-mixed">Mixed</span>
                    <span className="legend-tag tag-likely-ai">Likely AI</span>
                    <span className="legend-tag tag-heavy-ai">Heavy AI</span>
                  </div>
                </div>

                <div className="detector-heatmap-box">
                  {result.sentences.map((s: any) => {
                    let tagClass = 'tag-human';
                    if (s.isPlagiarized) tagClass = 'tag-plagiarized';
                    else if (s.category === 'heavy_ai') tagClass = 'tag-heavy-ai';
                    else if (s.category === 'likely_ai') tagClass = 'tag-likely-ai';
                    else if (s.category === 'mixed') tagClass = 'tag-mixed';

                    const isSelected = selectedSentence?.id === s.id;

                    return (
                      <span
                        key={s.id}
                        className={`heatmap-sentence ${tagClass} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedSentence(s)}
                        title={`Click to inspect sentence #${s.id}`}
                      >
                        {s.text}{' '}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Inspector for Selected Sentence */}
              {selectedSentence && (
                <div className="detector-sentence-inspector">
                  <div className="inspector-header">
                    <div className="inspector-title">
                      <strong>Sentence #{selectedSentence.id} Details</strong>
                      <span className={`inspector-badge ${selectedSentence.category}`}>
                        {selectedSentence.aiScore}% AI Probability
                      </span>
                    </div>
                  </div>
                  <p className="inspector-text">"{selectedSentence.text}"</p>
                  <div className="inspector-details-row">
                    <span><strong>Perplexity:</strong> {selectedSentence.perplexity}</span>
                    <span><strong>Burstiness:</strong> {selectedSentence.burstiness}</span>
                    <span><strong>Words:</strong> {selectedSentence.wordCount}</span>
                  </div>
                  <p className="inspector-reason">
                    <Info size={14} style={{ marginRight: '6px', verticalAlign: 'middle', flexShrink: 0 }} />
                    {selectedSentence.explanation}
                  </p>
                  {selectedSentence.plagiarismMatch && (
                    <div className="inspector-match-alert">
                      <AlertCircle size={14} />
                      <span>
                        Matching {selectedSentence.plagiarismMatch.source} ({selectedSentence.plagiarismMatch.similarity}% similarity)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Web Sources list if available */}
              {result.webSources && result.webSources.length > 0 && (
                <div className="detector-web-sources-card">
                  <h4><Globe size={16} /> Online Matches Found ({result.webSources.length})</h4>
                  <div className="web-sources-list">
                    {result.webSources.map((ws: any, idx: number) => (
                      <div key={idx} className="web-source-row">
                        <div className="source-meta">
                          <a href={ws.url} target="_blank" rel="noreferrer" className="source-title-link">
                            {ws.title} <ExternalLink size={12} />
                          </a>
                          <span className="source-pct">{ws.matchPercentage}% match</span>
                        </div>
                        <p className="source-preview">"{ws.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Generate Official Report */}
              <div className="detector-report-cta-row">
                <button
                  className="primary-button generate-report-btn"
                  onClick={() => setIsReportOpen(true)}
                >
                  <FileText size={17} />
                  <span>Generate Official Report & Export PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={result}
        documentTitle="AI_Grammar_Studio_Originality_Report"
      />
    </div>
  );
};

export default DetectorPage;
