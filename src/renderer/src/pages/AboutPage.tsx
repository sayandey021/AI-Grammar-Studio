import React from 'react';
import {
  Shield,
  Cpu,
  Zap,
  Bug,
  ExternalLink,
  Sparkles,
  Layers,
  Code2,
  Heart,
  Globe2,
  Lock
} from 'lucide-react';
import appLogo from '../assets/logo.png';
import packageInfo from '../../../../package.json';

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const AboutPage: React.FC = () => {
  const openUrl = (url: string) => {
    if ((window as any).api?.openExternalUrl) {
      (window as any).api.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="page-content about-page-wrapper">
      <div className="about-card">

        {/* Header Hero Section */}
        <div className="about-hero-section">
          <div className="about-icon-badge">
            <img src={appLogo} alt="AI Grammar Studio" className="about-logo-img" />
          </div>
          <h1 className="about-title">AI Grammar Studio</h1>
          <div className="about-badge-row">
            <span className="about-version-badge">v{packageInfo.version}</span>
            <span className="about-pill-tag">100% Offline AI</span>
            <span className="about-pill-tag highlight">On-Device Neural Suite</span>
          </div>
          <p className="about-desc">
            An advanced, privacy-first desktop writing workstation designed for real-time proofreading, deep linguistic analytics, multilingual neural translation, and generative writing without cloud reliance.
          </p>
        </div>

        {/* Developer & Creator Profile Card */}
        <div className="about-developer-card">
          <div className="about-dev-avatar">
            <Heart size={20} color="#f43f5e" />
          </div>
          <div className="about-dev-info">
            <div className="about-dev-role">Architect & Lead Developer</div>
            <div className="about-dev-name-row">
              <span className="about-dev-name">Sayan Dey</span>
              <span className="about-dev-handle">@sayandey021</span>
            </div>
            <p className="about-dev-bio">
              Building high-performance on-device AI applications and modern developer tools.
            </p>
          </div>
          <div className="about-dev-links">
            <button
              className="about-social-btn linkedin"
              onClick={() => openUrl('https://www.linkedin.com/in/sayan-dey021/')}
              title="Connect with Sayan Dey on LinkedIn"
            >
              <LinkedInIcon />
              <span>LinkedIn</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </button>
            <button
              className="about-social-btn github"
              onClick={() => openUrl('https://github.com/sayandey021')}
              title="Follow Sayan Dey on GitHub"
            >
              <GitHubIcon />
              <span>GitHub</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </button>
          </div>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="about-section-heading">
          <Layers size={15} />
          <span>Core Engineering Pillars</span>
        </div>

        <div className="about-features-grid">
          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper shield">
              <Shield size={18} />
            </div>
            <div className="about-feature-text">
              <strong>100% Private & Zero Cloud Telemetry</strong>
              <p>Your writing never leaves your local hardware. All AI inferences and linguistic passes run entirely on-device.</p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper cpu">
              <Cpu size={18} />
            </div>
            <div className="about-feature-text">
              <strong>DirectML & Hardware Acceleration</strong>
              <p>DirectX 12 DirectML & CUDA support for AMD Radeon, NVIDIA, and Intel GPUs with multi-threaded WASM fallback.</p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper zap">
              <Zap size={18} />
            </div>
            <div className="about-feature-text">
              <strong>Multi-Layered Heuristic & Neural Core</strong>
              <p>Combines sub-millisecond dictionary and rule engines with deep contextual T5 transformer models.</p>
            </div>
          </div>

          <div className="about-feature-item">
            <div className="about-feature-icon-wrapper globe">
              <Globe2 size={18} />
            </div>
            <div className="about-feature-text">
              <strong>Offline Neural Translation</strong>
              <p>Meta NLLB-200 distilled architecture enabling high-accuracy translation across 35+ global languages offline.</p>
            </div>
          </div>
        </div>

        {/* System Specs & Tech Stack Bar */}
        <div className="about-specs-bar">
          <div className="about-spec-col">
            <span className="spec-label">RUNTIME</span>
            <span className="spec-val">ONNX Runtime • DirectML</span>
          </div>
          <div className="about-spec-divider" />
          <div className="about-spec-col">
            <span className="spec-label">FRAMEWORK</span>
            <span className="spec-val">Electron • React • Vite</span>
          </div>
          <div className="about-spec-divider" />
          <div className="about-spec-col">
            <span className="spec-label">LICENSE</span>
            <span className="spec-val">GNU GPL v3.0</span>
          </div>
        </div>

        {/* Action Buttons: Report Bug & GitHub Repo */}
        <div className="about-actions-row">
          <button
            id="report-bug-btn"
            className="about-btn-action about-btn-report-bug"
            onClick={() => openUrl('https://github.com/sayandey021/AI-Grammar-Studio/issues')}
            title="Report a bug or feature request on GitHub"
          >
            <Bug size={16} />
            <span>Report an Issue</span>
          </button>

          <button
            id="github-repo-btn"
            className="about-btn-action about-btn-secondary"
            onClick={() => openUrl('https://github.com/sayandey021/AI-Grammar-Studio')}
            title="View Source on GitHub"
          >
            <GitHubIcon />
            <span>Repository</span>
            <ExternalLink size={13} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
