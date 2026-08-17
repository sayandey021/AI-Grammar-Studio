import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import appLogo from '../assets/logo.png';

interface SettingsPageProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

interface ModelStatus {
  downloaded: boolean;
  downloading: boolean;
  progress: number;
  modelId?: string;
  modelName?: string;
  sizeMB?: number;
}

const AVAILABLE_MODELS = [
  // ── Grammar Models (Sorted by Parameters: 80M -> 250M -> 783M) ───────────────
  {
    id: 'jonawhisper-gec-small',
    category: 'grammar',
    name: 'Gec-T5 Small',
    parameters: '80M',
    paramsCount: 0.08,
    sizeMB: 120,
    desc: 'Lightweight offline grammar and spelling correction model.'
  },
  {
    id: 'flan-t5-base',
    category: 'grammar',
    name: 'T5 Base (Grammar)',
    parameters: '250M',
    paramsCount: 0.25,
    sizeMB: 350,
    desc: 'Blazing fast, specialized grammar correction.'
  },
  {
    id: 'flan-t5-large',
    category: 'grammar',
    name: 'Flan-T5 Large',
    parameters: '783M',
    paramsCount: 0.783,
    sizeMB: 850,
    desc: 'High precision offline grammar & spell correction.'
  },
  {
    id: 'coedit-large',
    category: 'grammar',
    name: 'CoEdIT Large',
    parameters: '783M',
    paramsCount: 0.783,
    sizeMB: 3260,
    desc: 'Grammarly\'s specialized SOTA text-editing model for professional grammar correction & tone adjustment.'
  },

  // ── Creative Models (Sorted by Parameters: 0.6B -> 1.0B -> 1.2B -> 1.5B -> 1.7B) ──
  {
    id: 'qwen3-0.6b',
    category: 'creative',
    name: 'Qwen 3',
    parameters: '0.6B',
    paramsCount: 0.6,
    sizeMB: 877,
    desc: 'Alibaba\'s Qwen 3 0.6B — fast offline reasoning with thinking support.',
    supportsThinking: true
  },
  {
    id: 'gemma-3-1b',
    category: 'creative',
    name: 'Gemma 3',
    parameters: '1.0B',
    paramsCount: 1.0,
    sizeMB: 860,
    desc: 'Google\'s latest state-of-the-art 1B instruction-tuned model for high accuracy rewriting.'
  },
  {
    id: 'llama-3.2-1b',
    category: 'creative',
    name: 'Llama 3.2',
    parameters: '1.2B',
    paramsCount: 1.23,
    sizeMB: 1620,
    desc: 'Meta\'s state-of-the-art 1B instruction-tuned model for creative writing & drafting.'
  },
  {
    id: 'qwen-1.5b',
    category: 'creative',
    name: 'Qwen 2.5',
    parameters: '1.5B',
    paramsCount: 1.54,
    sizeMB: 900,
    desc: 'Alibaba\'s Qwen 2.5 1.5B model for high-capability creative generation and reasoning.'
  },
  {
    id: 'qwen3-1.7b',
    category: 'creative',
    name: 'Qwen 3',
    parameters: '1.7B',
    paramsCount: 1.72,
    sizeMB: 1400,
    desc: 'Alibaba\'s Qwen 3 1.7B — higher quality creative writing and reasoning with thinking support (~1.4GB).',
    supportsThinking: true
  }
];

const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: { value: string, label: string }[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <>
      <div
        className="custom-select-container"
        ref={containerRef}
        onClick={handleToggle}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleToggle(); }}
      >
        <div className="custom-select-value">
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
            {selectedOption.label}
          </span>
          <span className={`custom-select-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      {isOpen && dropdownRect && createPortal(
        <div
          ref={dropdownRef}
          className="custom-select-dropdown portal-dropdown"
          style={{
            top: `${dropdownRect.top}px`,
            left: `${dropdownRect.left}px`,
            width: `${dropdownRect.width}px`
          }}
        >
          {options.map(option => (
            <div
              key={option.value}
              className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings || {
    theme: 'system',
    defaultMode: 'quick',
    defaultTone: 'professional',
    activeGrammarModelId: 'flan-t5-base',
    activeCreativeModelId: 'qwen3-0.6b',
    executionDevice: 'auto',
    customDictionary: []
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const [activeTab, setActiveTab] = useState<'all' | 'models' | 'hardware' | 'general' | 'dictionary'>('all');
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelStatus>>({});
  const [gpuInfo, setGpuInfo] = useState<any>(null);
  const [newWords, setNewWords] = useState('');
  const [dictSearch, setDictSearch] = useState('');

  useEffect(() => {
    const loadStatuses = async () => {
      if (!window.api?.getModelStatus) return;
      const statuses: Record<string, ModelStatus> = {};
      for (const m of AVAILABLE_MODELS) {
        statuses[m.id] = await window.api.getModelStatus(m.id);
      }
      setModelStatuses(statuses);
    };
    loadStatuses();

    if (window.api?.getGpuInfo) {
      window.api.getGpuInfo().then((info: any) => setGpuInfo(info)).catch(() => { });
    }

    let unsubscribe: any = null;
    if (window.api?.onModelProgress) {
      unsubscribe = window.api.onModelProgress((modelId: string, progress: number) => {
        setModelStatuses(prev => ({
          ...prev,
          [modelId]: {
            ...(prev[modelId] || { downloaded: false, downloading: true, progress: 0 }),
            downloading: progress < 100,
            downloaded: progress >= 100,
            progress
          }
        }));
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleChange = (key: string, value: string) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    window.api.saveSettings(newSettings);
  };

  const handleDownload = async (modelId: string) => {
    // Check if a partial .tmp file exists to show "Resuming" state
    setModelStatuses(prev => ({
      ...prev,
      [modelId]: { ...prev[modelId], downloading: true, progress: prev[modelId]?.progress || 0 }
    }));
    try {
      await window.api.downloadModel(modelId);
      const status = await window.api.getModelStatus(modelId);
      setModelStatuses(prev => ({ ...prev, [modelId]: status }));
    } catch (error: any) {
      console.error('Download failed:', error);
      const msg = error?.message || 'Please check your internet connection and try again.';
      // Show retry-friendly alert
      alert(`Download interrupted: ${msg}\n\nClick "Download Model" again to resume from where it stopped.`);
      setModelStatuses(prev => ({
        ...prev,
        [modelId]: { ...prev[modelId], downloading: false, progress: 0 }
      }));
    }
  };

  const handleDelete = async (modelId: string) => {
    if (!window.confirm(`Are you sure you want to delete this model?`)) {
      return;
    }

    if (localSettings.activeGrammarModelId === modelId) {
      handleChange('activeGrammarModelId', 'flan-t5-base');
    }
    if (localSettings.activeCreativeModelId === modelId) {
      handleChange('activeCreativeModelId', 'qwen3-0.6b');
    }

    try {
      await window.api.deleteModel(modelId);
      setModelStatuses(prev => ({
        ...prev,
        [modelId]: { ...prev[modelId], downloaded: false, downloading: false, progress: 0 }
      }));
      const status = await window.api.getModelStatus(modelId);
      if (status) {
        setModelStatuses(prev => ({ ...prev, [modelId]: status }));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleOpenLocation = async (modelId: string) => {
    if (window.api?.openModelLocation) {
      await window.api.openModelLocation(modelId);
    }
  };

  const handleAddWords = async () => {
    if (!newWords.trim()) return;
    const words = newWords.split(',').map(w => w.trim()).filter(w => w.length > 0);

    let updatedDict = localSettings.customDictionary || [];
    for (const word of words) {
      updatedDict = await window.api.addCustomWord(word);
    }

    const newSettings = { ...localSettings, customDictionary: updatedDict };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    setNewWords('');
  };

  const filteredDictionary = (localSettings.customDictionary || []).filter((w: string) =>
    w.toLowerCase().includes(dictSearch.toLowerCase())
  );

  return (
    <div className="page-content settings-page">
      <div className="settings-container">

        {/* Header Banner */}
        <div className="settings-header-banner">
          <div className="settings-title-group">
            <div className="settings-logo-badge">
              <img src={appLogo} alt="AI Grammar Studio" className="settings-logo-img" />
            </div>
            <div>
              <h1 className="settings-title">Preferences & Settings</h1>
              <p className="settings-subtitle">Configure AI models, hardware acceleration, and application behavior.</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs-nav">
          <button
            className={`settings-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Overview
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            AI Models
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('hardware')}
          >
            Compute Engine
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            Appearance
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveTab('dictionary')}
          >
            Dictionary
          </button>
        </div>

        {/* SECTION 1: GENERAL & APPEARANCE */}
        {(activeTab === 'all' || activeTab === 'general') && (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">Appearance & Defaults</h3>
              <p className="settings-card-desc">Personalize the editor's visual style and initial startup behavior.</p>
            </div>

            <div className="settings-field-grid">
              <div className="settings-field-row">
                <div>
                  <div className="settings-field-label">Interface Theme</div>
                  <div className="settings-field-subtext">Select color theme mode</div>
                </div>
                <CustomSelect
                  value={localSettings.theme}
                  onChange={(v) => handleChange('theme', v)}
                  options={[
                    { value: 'system', label: 'System Preference' },
                    { value: 'dark', label: 'Dark Theme' },
                    { value: 'light', label: 'Light Theme' }
                  ]}
                />
              </div>

              <div className="settings-field-row">
                <div>
                  <div className="settings-field-label">Default Grammar Mode</div>
                  <div className="settings-field-subtext">Default engine for text checks</div>
                </div>
                <CustomSelect
                  value={localSettings.defaultMode}
                  onChange={(v) => handleChange('defaultMode', v)}
                  options={[
                    { value: 'quick', label: 'Quick Mode' },
                    { value: 'ai', label: 'AI Deep Engine' }
                  ]}
                />
              </div>


            </div>
          </div>
        )}

        {/* SECTION 2: HARDWARE ACCELERATION */}
        {(activeTab === 'all' || activeTab === 'hardware') && (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">Compute Engine & Hardware Acceleration</h3>
              <p className="settings-card-desc">Choose whether AI models run on CPU multi-threading or dedicated GPU hardware (NVIDIA CUDA / AMD DirectML).</p>
            </div>

            {gpuInfo && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Detected Graphics Hardware</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {gpuInfo.devices && gpuInfo.devices.length > 0 ? (
                      gpuInfo.devices.map((d: any, idx: number) => (
                        <span key={idx} style={{ color: '#818cf8', fontWeight: 500 }}>
                          {idx > 0 ? ' • ' : ''}{d.model}
                        </span>
                      ))
                    ) : (
                      <span>Multi-Core CPU WASM Engine Active</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                {
                  id: 'auto',
                  name: 'Auto Hardware (Recommended)',
                  badge: 'Recommended',
                  badgeColor: '#10b981',
                  desc: 'Automatically leverages NVIDIA CUDA or AMD DirectML GPU with CPU fallback.'
                },
                {
                  id: 'cuda',
                  name: 'NVIDIA GPU (CUDA)',
                  badge: 'NVIDIA',
                  badgeColor: '#76b900',
                  desc: 'High-speed hardware acceleration for NVIDIA GeForce GTX/RTX GPUs.'
                },
                {
                  id: 'directml',
                  name: 'AMD GPU (DirectML)',
                  badge: 'AMD',
                  badgeColor: '#ed1c24',
                  desc: 'DirectX 12 DirectML acceleration for AMD Radeon graphics.'
                },
                {
                  id: 'cpu',
                  name: 'System CPU (WASM)',
                  badge: 'Universal',
                  badgeColor: '#6366f1',
                  desc: 'Executes inference across CPU cores using WASM multi-threading.'
                }
              ].map(dev => {
                const isSelected = (localSettings.executionDevice || 'auto') === dev.id;
                return (
                  <div
                    key={dev.id}
                    className={`hardware-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleChange('executionDevice', dev.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: dev.badgeColor,
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {dev.badge}
                        </span>
                        <input
                          type="radio"
                          name="executionDevice"
                          checked={isSelected}
                          onChange={() => handleChange('executionDevice', dev.id)}
                          style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                        />
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{dev.name}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{dev.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: AI MODELS */}
        {(activeTab === 'all' || activeTab === 'models') && (
          <>
            {/* Grammar AI Models */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h3 className="settings-card-title" style={{ color: '#818cf8' }}>Grammar Correction Models</h3>
                <p className="settings-card-desc">Powering real-time grammar checks and rewriting inside the Editor.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {AVAILABLE_MODELS.filter(m => m.category === 'grammar').map(model => {
                  const status = modelStatuses[model.id] || { downloaded: false, downloading: false, progress: 0 };
                  const isActive = (localSettings.activeGrammarModelId || 'flan-t5-base') === model.id;

                  return (
                    <div
                      key={model.id}
                      className={`model-item-card ${isActive ? 'active-grammar' : ''}`}
                      onClick={() => {
                        if (status.downloaded && !isActive) {
                          handleChange('activeGrammarModelId', model.id);
                        }
                      }}
                    >
                      <div className="model-card-header">
                        <div>
                          <div className="model-title-row">
                            <h4 className="model-name">{model.name}</h4>
                            {(model as any).parameters && (
                              <span className="model-params-badge">{(model as any).parameters}</span>
                            )}
                            <span className="model-size-badge">
                              {status.downloaded && (status as any).sizeMB > 0
                                ? `${(status as any).sizeMB} MB on disk`
                                : `~${model.sizeMB} MB estimated`
                              }
                            </span>
                            {isActive && <span className="badge-active-tag badge-active-grammar">Active</span>}
                          </div>
                          <p className="model-desc-text">{model.desc}</p>
                        </div>
                        <input
                          type="radio"
                          name="activeGrammarModel"
                          checked={isActive}
                          onChange={() => handleChange('activeGrammarModelId', model.id)}
                          disabled={!status.downloaded}
                          style={{ cursor: status.downloaded ? 'pointer' : 'not-allowed', accentColor: '#6366f1' }}
                        />
                      </div>

                      {status.downloading && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                            <span>Downloading weights...</span>
                            <span>{status.progress}%</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ background: '#6366f1', height: '100%', width: `${status.progress}%`, transition: 'width 0.2s' }} />
                          </div>
                        </div>
                      )}

                      <div className="model-action-bar">
                        <div className="model-status-indicator">
                          <span className={`status-dot ${status.downloading ? 'downloading' : status.downloaded ? 'installed' : 'missing'}`} />
                          <span style={{ color: status.downloaded ? '#10b981' : status.downloading ? '#3b82f6' : '#64748b' }}>
                            {status.downloading ? 'Downloading...' : status.downloaded ? 'Installed & Ready' : 'Not Downloaded'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!status.downloaded && !status.downloading && (
                            <button
                              className="btn-sm-action btn-primary-glow"
                              onClick={(e) => { e.stopPropagation(); handleDownload(model.id); }}
                            >
                              Download Model
                            </button>
                          )}
                          {status.downloaded && (
                            <button
                              className="btn-sm-action btn-outline-danger"
                              onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}
                            >
                              Delete
                            </button>
                          )}
                          <button
                            className="btn-sm-action btn-outline-subtle"
                            onClick={(e) => { e.stopPropagation(); handleOpenLocation(model.id); }}
                          >
                            Folder
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Creative AI Models */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h3 className="settings-card-title" style={{ color: '#34d399' }}>Creative Writing Models</h3>
                <p className="settings-card-desc">Powering text generation, brainstorming, and prompt studio creation.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {AVAILABLE_MODELS.filter(m => m.category === 'creative').map(model => {
                  const status = modelStatuses[model.id] || { downloaded: false, downloading: false, progress: 0 };
                  const isActive = (localSettings.activeCreativeModelId || 'qwen3-0.6b') === model.id;

                  return (
                    <div
                      key={model.id}
                      className={`model-item-card ${isActive ? 'active-creative' : ''}`}
                      onClick={() => {
                        if (status.downloaded && !isActive) {
                          handleChange('activeCreativeModelId', model.id);
                        }
                      }}
                    >
                      <div className="model-card-header">
                        <div>
                          <div className="model-title-row">
                            <h4 className="model-name">{model.name}</h4>
                            {(model as any).parameters && (
                              <span className="model-params-badge">{(model as any).parameters}</span>
                            )}
                            {(model as any).supportsThinking && (
                              <span className="model-thinking-badge">
                                Thinking
                              </span>
                            )}
                            <span className="model-size-badge">
                              {status.downloaded && (status as any).sizeMB > 0
                                ? `${(status as any).sizeMB} MB on disk`
                                : `~${model.sizeMB} MB estimated`
                              }
                            </span>
                            {isActive && <span className="badge-active-tag badge-active-creative">Active</span>}
                          </div>
                          <p className="model-desc-text">{model.desc}</p>
                        </div>
                        <input
                          type="radio"
                          name="activeCreativeModel"
                          checked={isActive}
                          onChange={() => handleChange('activeCreativeModelId', model.id)}
                          disabled={!status.downloaded}
                          style={{ cursor: status.downloaded ? 'pointer' : 'not-allowed', accentColor: '#10b981' }}
                        />
                      </div>

                      {status.downloading && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                            <span>Downloading weights...</span>
                            <span>{status.progress}%</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ background: '#10b981', height: '100%', width: `${status.progress}%`, transition: 'width 0.2s' }} />
                          </div>
                        </div>
                      )}

                      <div className="model-action-bar">
                        <div className="model-status-indicator">
                          <span className={`status-dot ${status.downloading ? 'downloading' : status.downloaded ? 'installed' : 'missing'}`} />
                          <span style={{ color: status.downloaded ? '#10b981' : status.downloading ? '#3b82f6' : '#64748b' }}>
                            {status.downloading ? 'Downloading...' : status.downloaded ? 'Installed & Ready' : 'Not Downloaded'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!status.downloaded && !status.downloading && (
                            <button
                              className="btn-sm-action btn-creative-glow"
                              onClick={(e) => { e.stopPropagation(); handleDownload(model.id); }}
                            >
                              Download Model
                            </button>
                          )}
                          {status.downloaded && (
                            <button
                              className="btn-sm-action btn-outline-danger"
                              onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}
                            >
                              Delete
                            </button>
                          )}
                          <button
                            className="btn-sm-action btn-outline-subtle"
                            onClick={(e) => { e.stopPropagation(); handleOpenLocation(model.id); }}
                          >
                            Folder
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* SECTION 4: CUSTOM DICTIONARY */}
        {(activeTab === 'all' || activeTab === 'dictionary') && (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">Custom Vocabulary Dictionary</h3>
              <p className="settings-card-desc">Add technical terms, acronyms, or proper nouns to bypass spellchecking warnings.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Add words (comma separated)..."
                value={newWords}
                onChange={(e) => setNewWords(e.target.value)}
                className="settings-text-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddWords();
                }}
              />
              <button
                className="btn-sm-action btn-primary-glow"
                style={{ padding: '10px 20px' }}
                onClick={handleAddWords}
                disabled={!newWords.trim()}
              >
                Add Words
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Saved Dictionary Words ({(localSettings.customDictionary || []).length})
              </div>

              {(localSettings.customDictionary || []).length > 5 && (
                <input
                  type="text"
                  placeholder="Filter words..."
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                  className="settings-filter-input"
                />
              )}
            </div>

            {(!filteredDictionary || filteredDictionary.length === 0) ? (
              <div className="dictionary-empty-state">
                {dictSearch ? 'No words match your filter.' : 'Your custom dictionary is currently empty.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {filteredDictionary.map((word: string) => (
                  <div key={word} className="dictionary-word-tag">
                    {word}
                    <button
                      onClick={async () => {
                        const newDict = await window.api.removeCustomWord(word);
                        const newSettings = { ...localSettings, customDictionary: newDict };
                        setLocalSettings(newSettings);
                        onSettingsChange(newSettings);
                      }}
                      className="dictionary-tag-remove"
                      title={`Remove ${word}`}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
