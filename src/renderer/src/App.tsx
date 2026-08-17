import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EditorPage from './pages/EditorPage';
import SettingsPage from './pages/SettingsPage';
import AnalysisPage from './pages/AnalysisPage';
import PromptPage from './pages/PromptPage';
import { Shield, Cpu, Zap } from 'lucide-react';
import appLogo from './assets/logo.png';
import packageInfo from '../../../package.json';

const AboutPage = () => (
  <div className="page-content about-page-wrapper">
    <div className="about-card">
      <div className="about-icon-badge">
        <img src={appLogo} alt="AI Grammar Studio" className="about-logo-img" />
      </div>
      <h2 className="about-title">AI Grammar Studio</h2>
      <p className="about-version">Version {packageInfo.version}</p>
      <p className="about-developer">Developed by <span className="about-developer-name">Saayan</span></p>
      <p className="about-desc">
      A private, offline-first intelligent writing assistant powered by WebGPU and local ONNX neural networks.
    </p>
    <div className="about-features-grid">
      <div className="about-feature-item">
        <Shield size={18} color="#10b981" />
        <div>
          <strong>100% Offline & Private</strong>
          <p>Your text never leaves your computer.</p>
        </div>
      </div>
      <div className="about-feature-item">
        <Cpu size={18} color="#6366f1" />
        <div>
          <strong>Hardware Accelerated</strong>
          <p>DirectML & WebGPU local model inference.</p>
        </div>
      </div>
      <div className="about-feature-item">
        <Zap size={18} color="#f59e0b" />
        <div>
          <strong>Instant Rule & Deep AI</strong>
          <p>Multi-layered spell & deep grammar corrections.</p>
        </div>
      </div>
    </div>
  </div>
  </div >
);

type Page = 'editor' | 'prompt' | 'analysis' | 'settings' | 'about';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('editor');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Load settings on startup
    window.api?.getSettings().then((s: any) => setSettings(s));
  }, []);

  useEffect(() => {
    const theme = settings?.theme || 'system';

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if ((settings?.theme || 'system') === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings?.theme]);

  const [pendingEditorText, setPendingEditorText] = useState<string | null>(null);

  const handleSendToEditor = (text: string) => {
    setPendingEditorText(text);
    setCurrentPage('editor');
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">
        <div style={{ display: currentPage === 'editor' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <EditorPage
            settings={settings}
            pendingText={pendingEditorText}
            onClearPendingText={() => setPendingEditorText(null)}
            onNavigateToSettings={() => setCurrentPage('settings')}
          />
        </div>
        <div style={{ display: currentPage === 'prompt' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <PromptPage
            settings={settings}
            onNavigateToSettings={() => setCurrentPage('settings')}
            onSendToEditor={handleSendToEditor}
          />
        </div>
        <div style={{ display: currentPage === 'analysis' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <AnalysisPage settings={settings} />
        </div>
        <div style={{ display: currentPage === 'settings' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <SettingsPage settings={settings} onSettingsChange={setSettings} />
        </div>
        <div style={{ display: currentPage === 'about' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <AboutPage />
        </div>
      </main>
    </div>
  );
}

export default App;
