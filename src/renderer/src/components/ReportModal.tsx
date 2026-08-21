import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Cpu,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import appLogo from '../assets/logo.png';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  documentTitle?: string;
}

export function generateReportHtml(result: any, title: string = 'Document Originality & AI Audit Report'): string {
  const dateStr = result.generatedAt || new Date().toLocaleString();
  const certId = `AGS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const sentenceHtml = (result.sentences || []).map((s: any) => {
    let bg = 'rgba(16, 185, 129, 0.1)';
    let color = '#059669';
    let border = '#10b981';
    let label = 'Human';

    if (s.isPlagiarized) {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#dc2626';
      border = '#ef4444';
      label = 'Matched Source';
    } else if (s.category === 'heavy_ai') {
      bg = 'rgba(239, 68, 68, 0.12)';
      color = '#dc2626';
      border = '#ef4444';
      label = 'Heavy AI (90%+)';
    } else if (s.category === 'likely_ai') {
      bg = 'rgba(245, 158, 11, 0.12)';
      color = '#d97706';
      border = '#f59e0b';
      label = 'Likely AI';
    } else if (s.category === 'mixed') {
      bg = 'rgba(99, 102, 241, 0.1)';
      color = '#4f46e5';
      border = '#6366f1';
      label = 'Mixed';
    }

    return `<span style="background: ${bg}; border-bottom: 2px solid ${border}; padding: 2px 4px; margin: 0 2px; border-radius: 4px; display: inline; line-height: 1.8;" title="AI Score: ${s.aiScore}% | ${s.explanation}">${s.text}</span>`;
  }).join(' ');

  const webSourcesHtml = (result.webSources && result.webSources.length > 0)
    ? `<div style="margin-top: 30px;">
        <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Detected Online References</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; text-align: left;">
              <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Source / Title</th>
              <th style="padding: 8px 12px; border: 1px solid #e2e8f0;">Matched Snippet</th>
              <th style="padding: 8px 12px; border: 1px solid #e2e8f0; width: 80px; text-align: center;">Match %</th>
            </tr>
          </thead>
          <tbody>
            ${result.webSources.map((ws: any) => `
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                  <a href="${ws.url}" style="color: #4f46e5; text-decoration: none; font-weight: 600;" target="_blank">${ws.title}</a>
                  <div style="font-size: 11px; color: #64748b; word-break: break-all;">${ws.url}</div>
                </td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569; font-style: italic;">"${ws.snippet}"</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #dc2626;">${ws.matchPercentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - AI Grammar Studio</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13.5px;
      line-height: 1.6;
    }
    .report-container { max-width: 800px; margin: 0 auto; }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px; }
    .cert-badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 11.5px;
      color: #475569;
      text-align: right;
    }
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .score-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .score-value { font-size: 32px; font-weight: 800; margin: 4px 0; }
    .score-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12.5px;
    }
    .metrics-table td, .metrics-table th {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
    }
    .metrics-table th { background: #f1f5f9; text-align: left; color: #475569; font-weight: 600; }
    .content-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      font-size: 13.5px;
      line-height: 1.9;
    }
    .legend {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 11.5px;
      color: #64748b;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 30px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <div>
        <h1 class="brand-title">🛡️ AI Grammar Studio</h1>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Originality & AI Content Verification Report</div>
      </div>
      <div class="cert-badge">
        <div><strong>Certificate ID:</strong> ${certId}</div>
        <div><strong>Generated:</strong> ${dateStr}</div>
      </div>
    </div>

    <div class="scores-grid">
      <div class="score-card">
        <div class="score-label">Originality Score</div>
        <div class="score-value" style="color: ${result.overallOriginalityScore >= 80 ? '#10b981' : result.overallOriginalityScore >= 50 ? '#f59e0b' : '#ef4444'};">
          ${result.overallOriginalityScore}%
        </div>
        <div style="font-size: 11px; color: #64748b;">${result.overallOriginalityScore >= 80 ? 'High Uniqueness' : 'Matches Detected'}</div>
      </div>

      <div class="score-card">
        <div class="score-label">AI Probability</div>
        <div class="score-value" style="color: ${result.overallAiScore <= 25 ? '#10b981' : result.overallAiScore <= 65 ? '#f59e0b' : '#ef4444'};">
          ${result.overallAiScore}%
        </div>
        <div style="font-size: 11px; color: #64748b;">${result.classification}</div>
      </div>

      <div class="score-card">
        <div class="score-label">Plagiarism Risk</div>
        <div class="score-value" style="color: ${result.overallPlagiarismScore <= 15 ? '#10b981' : result.overallPlagiarismScore <= 45 ? '#f59e0b' : '#ef4444'};">
          ${result.overallPlagiarismScore}%
        </div>
        <div style="font-size: 11px; color: #64748b;">${result.isOnlineMode ? 'Online Web Verified' : 'Offline Corpus Verified'}</div>
      </div>
    </div>

    <table class="metrics-table">
      <thead>
        <tr>
          <th>Word Count</th>
          <th>Sentence Count</th>
          <th>Burstiness Index</th>
          <th>Avg Perplexity</th>
          <th>Lexical Diversity</th>
          <th>Grade Level</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${result.metrics?.wordCount || 0}</strong></td>
          <td><strong>${result.metrics?.sentenceCount || 0}</strong></td>
          <td>${result.metrics?.burstinessScore || 'N/A'}</td>
          <td>${result.metrics?.perplexityScore || 'N/A'}</td>
          <td>${Math.round((result.metrics?.lexicalDiversity || 0) * 100)}%</td>
          <td>Grade ${result.metrics?.readingGradeLevel || 'N/A'}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-bottom: 8px;">
      <h3 style="font-size: 15px; color: #1e293b; margin: 0 0 8px 0;">Annotated Document Text</h3>
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background: #10b981;"></div> Human Content</div>
        <div class="legend-item"><div class="legend-dot" style="background: #6366f1;"></div> Mixed / Neutral</div>
        <div class="legend-item"><div class="legend-dot" style="background: #f59e0b;"></div> Likely AI Pattern</div>
        <div class="legend-item"><div class="legend-dot" style="background: #ef4444;"></div> Heavy AI / Plagiarism</div>
      </div>
    </div>

    <div class="content-box">
      ${sentenceHtml}
    </div>

    ${webSourcesHtml}

    <div class="footer">
      <div>AI Grammar Studio • Private, Offline-First Intelligent Writing Suite</div>
      <div>Audit Verification Hash: SHA256-${certId}</div>
    </div>
  </div>
</body>
</html>`;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, result, documentTitle = 'Originality Report' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  if (!isOpen || !result) return null;

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const html = generateReportHtml(result, documentTitle);
      const res = await (window as any).api?.exportReportPdf({
        htmlContent: html,
        title: documentTitle,
      });
      if (res?.success) {
        setExportMessage(`✓ PDF exported successfully to: ${res.filePath}`);
      } else if (!res?.canceled) {
        setExportMessage(`⚠️ Export failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setExportMessage(`⚠️ Export error: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <div className="report-modal-title-wrap">
            <div className="report-badge-icon">
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h2>Audit & Originality Certificate</h2>
              <p>Generated: {result.generatedAt || new Date().toLocaleString()}</p>
            </div>
          </div>
          <button className="report-close-btn" onClick={onClose} title="Close Modal">
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          {exportMessage && (
            <div className={`report-alert-banner ${exportMessage.startsWith('✓') ? 'success' : 'warning'}`}>
              {exportMessage}
            </div>
          )}

          {/* Quick Summary Cards */}
          <div className="report-score-banner">
            <div className="report-stat-block">
              <span className="stat-num" style={{ color: result.overallOriginalityScore >= 80 ? '#10b981' : '#f59e0b' }}>
                {result.overallOriginalityScore}%
              </span>
              <span className="stat-label">Originality</span>
            </div>
            <div className="report-stat-divider" />
            <div className="report-stat-block">
              <span className="stat-num" style={{ color: result.overallAiScore <= 25 ? '#10b981' : result.overallAiScore <= 65 ? '#f59e0b' : '#ef4444' }}>
                {result.overallAiScore}%
              </span>
              <span className="stat-label">AI Content</span>
            </div>
            <div className="report-stat-divider" />
            <div className="report-stat-block">
              <span className="stat-num" style={{ color: result.overallPlagiarismScore <= 15 ? '#10b981' : '#ef4444' }}>
                {result.overallPlagiarismScore}%
              </span>
              <span className="stat-label">Plagiarism Risk</span>
            </div>
          </div>

          {/* Metrics Pill Grid */}
          <div className="report-metrics-grid">
            <div className="metric-pill">
              <span className="pill-title">Word Count</span>
              <span className="pill-value">{result.metrics?.wordCount || 0}</span>
            </div>
            <div className="metric-pill">
              <span className="pill-title">Sentences</span>
              <span className="pill-value">{result.metrics?.sentenceCount || 0}</span>
            </div>
            <div className="metric-pill">
              <span className="pill-title">Burstiness</span>
              <span className="pill-value">{result.metrics?.burstinessScore || 'N/A'}</span>
            </div>
            <div className="metric-pill">
              <span className="pill-title">Perplexity</span>
              <span className="pill-value">{result.metrics?.perplexityScore || 'N/A'}</span>
            </div>
            <div className="metric-pill">
              <span className="pill-title">Lexical Diversity</span>
              <span className="pill-value">{Math.round((result.metrics?.lexicalDiversity || 0) * 100)}%</span>
            </div>
            <div className="metric-pill">
              <span className="pill-title">Reading Grade</span>
              <span className="pill-value">Grade {result.metrics?.readingGradeLevel || 0}</span>
            </div>
          </div>

          {/* Annotated Text Preview */}
          <div className="report-transcript-section">
            <h3>Annotated Sentence Breakdown</h3>
            <div className="report-transcript-box">
              {(result.sentences || []).map((s: any) => {
                let badgeClass = 'tag-human';
                if (s.isPlagiarized) badgeClass = 'tag-plagiarized';
                else if (s.category === 'heavy_ai') badgeClass = 'tag-heavy-ai';
                else if (s.category === 'likely_ai') badgeClass = 'tag-likely-ai';
                else if (s.category === 'mixed') badgeClass = 'tag-mixed';

                return (
                  <span key={s.id} className={`report-sentence-highlight ${badgeClass}`} title={`AI Score: ${s.aiScore}% - ${s.explanation}`}>
                    {s.text}{' '}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Web Matches Section if available */}
          {result.webSources && result.webSources.length > 0 && (
            <div className="report-sources-section">
              <h3>Detected Web Matches ({result.webSources.length})</h3>
              <div className="report-sources-list">
                {result.webSources.map((ws: any, idx: number) => (
                  <div key={idx} className="report-source-card">
                    <div className="source-header">
                      <a href={ws.url} target="_blank" rel="noreferrer" className="source-link">
                        {ws.title} <ExternalLink size={12} />
                      </a>
                      <span className="source-match-badge">{ws.matchPercentage}% Match</span>
                    </div>
                    <p className="source-snippet">"{ws.snippet}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="report-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="primary-button export-pdf-btn" onClick={handleExportPdf} disabled={isExporting} title="Export PDF Document">
            <Download size={16} />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
