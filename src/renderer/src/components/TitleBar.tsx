import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Feather, 
  Languages, 
  Microscope, 
  ShieldCheck, 
  Settings, 
  Info, 
  Sun, 
  Moon, 
  Minus, 
  Square, 
  Copy, 
  X,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import appLogo from '../assets/logo.png';
import packageInfo from '../../../../package.json';

interface TitleBarProps {
  currentPage: string;
  onNavigate?: (page: any) => void;
  settings?: any;
  onThemeToggle?: () => void;
}

const PAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: 'Dashboard Hub', icon: LayoutDashboard },
  editor: { label: 'Editor', icon: PenTool },
  prompt: { label: 'Creative Writing', icon: Feather },
  translation: { label: 'Translation', icon: Languages },
  analysis: { label: 'Deep Analysis', icon: Microscope },
  detector: { label: 'AI & Plagiarism Detector', icon: ShieldCheck },
  settings: { label: 'Settings', icon: Settings },
  about: { label: 'About', icon: Info },
};

export const TitleBar: React.FC<TitleBarProps> = ({
  currentPage,
  onNavigate,
  settings,
  onThemeToggle,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Initial maximized state check
    if (window.api?.isWindowMaximized) {
      window.api.isWindowMaximized().then((max: boolean) => setIsMaximized(max));
    }

    // Subscribe to window state changes
    if (window.api?.onWindowMaximizedChange) {
      const unsub = window.api.onWindowMaximizedChange((max: boolean) => {
        setIsMaximized(max);
      });
      return unsub;
    }
  }, []);

  const handleMinimize = () => {
    window.api?.minimizeWindow?.();
  };

  const handleMaximizeRestore = () => {
    window.api?.maximizeWindow?.();
  };

  const handleClose = () => {
    window.api?.closeWindow?.();
  };

  const handleDoubleClick = () => {
    window.api?.maximizeWindow?.();
  };

  const currentMeta = PAGE_META[currentPage] || { label: 'Studio', icon: Sparkles };
  const CurrentIcon = currentMeta.icon;

  const isDarkMode = document.documentElement.classList.contains('dark-theme');

  return (
    <header className="custom-titlebar" onDoubleClick={handleDoubleClick}>
      {/* Left: Branding & Breadcrumb */}
      <div className="titlebar-left">
        <div 
          className="titlebar-brand"
          onClick={() => onNavigate?.('dashboard')}
          title="AI Grammar Studio - Open Dashboard"
        >
          <img src={appLogo} alt="AI Grammar Studio" className="titlebar-logo-img" />
          <span className="titlebar-app-name">AI Grammar Studio</span>
          <span className="titlebar-version-tag">v{packageInfo.version}</span>
        </div>

        <div className="titlebar-divider" />

        <div className="titlebar-breadcrumb">
          <CurrentIcon size={14} className="breadcrumb-icon" />
          <span className="breadcrumb-label">{currentMeta.label}</span>
        </div>
      </div>

      {/* Center Drag Region */}
      <div className="titlebar-center" />

      {/* Right: Theme Toggle & Window Controls */}
      <div className="titlebar-right">
        {onThemeToggle && (
          <button
            className="titlebar-tool-btn"
            onClick={onThemeToggle}
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}

        <div className="titlebar-window-controls">
          <button
            className="titlebar-win-btn btn-minimize"
            onClick={handleMinimize}
            title="Minimize"
            aria-label="Minimize Window"
          >
            <Minus size={14} strokeWidth={2} />
          </button>

          <button
            className="titlebar-win-btn btn-maximize"
            onClick={handleMaximizeRestore}
            title={isMaximized ? 'Restore Down' : 'Maximize'}
            aria-label={isMaximized ? 'Restore Down' : 'Maximize Window'}
          >
            {isMaximized ? (
              <Copy size={12} strokeWidth={2} className="restore-icon" />
            ) : (
              <Square size={12} strokeWidth={2} />
            )}
          </button>

          <button
            className="titlebar-win-btn btn-close"
            onClick={handleClose}
            title="Close"
            aria-label="Close Window"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TitleBar;
