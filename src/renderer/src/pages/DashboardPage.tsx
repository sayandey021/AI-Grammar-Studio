import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Feather,
  Languages,
  Microscope,
  ShieldCheck,
  Settings,
  Zap,
  Shield,
  Cpu,
  ArrowUpRight,
  Info,
  Sparkles
} from 'lucide-react';
import appLogo from '../assets/logo.png';
import packageInfo from '../../../../package.json';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  settings?: any;
}

const GRAMMAR_MODELS_MAP: Record<string, string> = {
  'jonawhisper-gec-small': 'Gec-T5 Small',
  'flan-t5-base': 'T5 Base (Grammar)',
  'flan-t5-large': 'Flan-T5 Large',
  'coedit-large': 'CoEdIT Large',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, settings }) => {
  const [modelStatus, setModelStatus] = useState<boolean | null>(null);
  const [gpuInfo, setGpuInfo] = useState<any>(null);

  const getExecutionDeviceLabel = () => {
    const pref = settings?.executionDevice || 'auto';
    const firstDevice = gpuInfo?.devices?.[0];
    const gpuModel = firstDevice?.model || firstDevice?.vendor;

    if (pref === 'cpu') {
      return 'CPU (WASM Multi-Core)';
    }
    if (pref === 'cuda') {
      return gpuModel ? `${gpuModel} (CUDA)` : 'NVIDIA GPU (CUDA)';
    }
    if (pref === 'directml') {
      return gpuModel ? `${gpuModel} (DirectML)` : 'AMD GPU (DirectML)';
    }
    // Auto detection
    if (gpuInfo?.hasAmd) {
      return gpuModel ? `${gpuModel} (DirectML)` : 'AMD GPU (DirectML)';
    }
    if (gpuInfo?.hasNvidia) {
      return gpuModel ? `${gpuModel} (CUDA)` : 'NVIDIA GPU (CUDA)';
    }
    if (gpuInfo?.hasIntel) {
      return gpuModel ? `${gpuModel} (DirectML)` : 'Intel GPU (DirectML)';
    }
    if (gpuInfo?.devices && gpuInfo.devices.length > 0) {
      return gpuModel ? `${gpuModel} (GPU)` : 'Hardware GPU Accelerated';
    }
    return 'CPU Neural Engine';
  };

  const isGpuActive = settings?.executionDevice !== 'cpu' && (gpuInfo?.hasGpu || (gpuInfo?.devices && gpuInfo.devices.length > 0));

  const activeGrammarModelId = settings?.activeGrammarModelId || settings?.activeModelId || 'flan-t5-base';
  const activeGrammarModelName = GRAMMAR_MODELS_MAP[activeGrammarModelId] || 'T5 Base (Grammar)';

  useEffect(() => {
    const modelId = activeGrammarModelId;

    const checkStatus = () => {
      if (window.api?.getModelStatus) {
        window.api.getModelStatus(modelId).then((status: any) => {
          setModelStatus(status?.downloaded ?? false);
        }).catch(() => setModelStatus(false));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2500);

    if (window.api?.getGpuInfo) {
      window.api.getGpuInfo().then((info: any) => setGpuInfo(info)).catch(() => { });
    }

    let unsubProg: any = null;
    if (window.api?.onModelProgress) {
      unsubProg = window.api.onModelProgress((mId: string, progress: number) => {
        if (mId === modelId) {
          setModelStatus(progress >= 100);
          checkStatus();
        }
      });
    }

    let unsubDel: any = null;
    if (window.api?.onModelDeleted) {
      unsubDel = window.api.onModelDeleted((mId: string) => {
        if (mId === modelId) {
          setModelStatus(false);
          checkStatus();
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (unsubProg) unsubProg();
      if (unsubDel) unsubDel();
    };
  }, [activeGrammarModelId]);

  const writingTools = [
    {
      id: 'editor',
      title: 'Grammar & Style Editor',
      desc: 'Real-time proofreading, spellcheck, punctuation, and tone refinement with contextual suggestions.',
      tag: 'Core Proofreading',
      icon: PenTool,
    },
    {
      id: 'prompt',
      title: 'Creative Writing Studio',
      desc: 'Generative text creation for stories, essays, outlines, poetry, and email drafts with reasoning visualizer.',
      tag: 'Generative AI',
      icon: Feather,
    },
    {
      id: 'translation',
      title: 'Neural Translation',
      desc: '100% offline multilingual translation across 35+ global languages supported.',
      tag: '35+ Languages',
      icon: Languages,
    }
  ];

  const analysisTools = [
    {
      id: 'analysis',
      title: 'Deep Linguistic Analysis',
      desc: 'Readability scoring, sentence pacing, vocabulary diversity, and lexical density analytics.',
      tag: 'Linguistics',
      icon: Microscope,
    },
    {
      id: 'detector',
      title: 'AI & Plagiarism Detector',
      desc: 'Sentence-level AI content classification and web similarity verification with PDF reports.',
      tag: 'Plagiarism',
      icon: ShieldCheck,
    },
    {
      id: 'settings',
      title: 'AI Models & Preferences',
      desc: 'Manage quantized neural weights, configure GPU/Vulkan acceleration, and manage custom dictionaries.',
      tag: 'Hardware & Models',
      icon: Settings,
    }
  ];

  const renderToolCard = (tool: any) => {
    const Icon = tool.icon;
    return (
      <div
        key={tool.id}
        className="dash-card"
        onClick={() => onNavigate(tool.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate(tool.id);
          }
        }}
      >
        <div className="dash-card-header">
          <div className="dash-icon-box">
            <Icon size={18} />
          </div>
          <div className="dash-card-arrow">
            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="dash-card-body">
          <h3 className="dash-card-title">{tool.title}</h3>
          <p className="dash-card-desc">{tool.desc}</p>
        </div>

        <div className="dash-card-footer">
          <span className="dash-card-tag">{tool.tag}</span>
          <span className="dash-card-action">Launch →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="dash-container">
      <div className="dash-content">

        {/* Top Hero Section */}
        <div className="dash-hero">
          <div className="dash-hero-header">
            <div className="dash-brand-block">
              <img src={appLogo} alt="Logo" className="dash-brand-logo" />
              <div>
                <h1 className="dash-brand-title">AI Grammar Studio</h1>
                <p className="dash-brand-subtitle">
                  Private, 100% on-device AI writing, linguistic analytics & translation suite
                </p>
              </div>
            </div>

          </div>

          {/* Quick Action Input Banner */}
          <div
            className="dash-quick-banner"
            onClick={() => onNavigate('editor')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-quick-left">
              <PenTool size={16} className="dash-quick-icon" />
              <span className="dash-quick-text">Click here to start writing or paste text to proofread immediately...</span>
            </div>
            <div className="dash-quick-btn">
              <span>Open Editor</span>
              <span className="dash-kbd">↵</span>
            </div>
          </div>
        </div>

        {/* Section 1: Writing & Language */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">Writing & Language Studios</h2>
            <span className="dash-section-count">{writingTools.length} Modules</span>
          </div>
          <div className="dash-grid">
            {writingTools.map(renderToolCard)}
          </div>
        </div>

        {/* Section 2: Analysis & Auditing */}
        <div className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">Linguistics, Auditing & Preferences</h2>
            <span className="dash-section-count">{analysisTools.length} Modules</span>
          </div>
          <div className="dash-grid">
            {analysisTools.map(renderToolCard)}
          </div>
        </div>

        {/* Bottom System & Privacy Health Strip */}
        <div className="dash-system-bar">
          <div className="dash-sys-item">
            <Shield size={14} className="dash-sys-icon green" />
            <div className="dash-sys-text">
              <span className="dash-sys-label">Privacy Guarantee</span>
              <span className="dash-sys-val">On-Device Processing</span>
            </div>
          </div>

          <div className="dash-sys-sep" />

          <div className="dash-sys-item">
            {modelStatus ? (
              <Zap size={14} className="dash-sys-icon blue" />
            ) : (
              <Sparkles size={14} className="dash-sys-icon amber" />
            )}
            <div className="dash-sys-text">
              <span className="dash-sys-label">Active Grammar Engine</span>
              <span className="dash-sys-val">
                {modelStatus ? activeGrammarModelName : 'Fast Heuristic Rules'}
              </span>
            </div>
          </div>

          <div className="dash-sys-sep" />

          <div className="dash-sys-item">
            <Cpu size={14} className={`dash-sys-icon ${isGpuActive ? 'purple' : 'muted'}`} />
            <div className="dash-sys-text">
              <span className="dash-sys-label">Execution Engine</span>
              <span className="dash-sys-val">
                {getExecutionDeviceLabel()}
              </span>
            </div>
          </div>

          <div className="dash-sys-sep" />

          <div
            className="dash-sys-item link"
            onClick={() => onNavigate('about')}
            role="button"
            tabIndex={0}
          >
            <Info size={14} className="dash-sys-icon muted" />
            <div className="dash-sys-text">
              <span className="dash-sys-label">App Info</span>
              <span className="dash-sys-val highlight">About v{packageInfo.version} →</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
