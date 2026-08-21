import { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import SettingsPage from './pages/SettingsPage';
import AnalysisPage from './pages/AnalysisPage';
import PromptPage from './pages/PromptPage';
import TranslationPage from './pages/TranslationPage';
import DetectorPage from './pages/DetectorPage';
import AboutPage from './pages/AboutPage';

type Page = 'dashboard' | 'editor' | 'prompt' | 'translation' | 'analysis' | 'detector' | 'settings' | 'about';

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

  const handleQuickThemeToggle = () => {
    const isDark = document.documentElement.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    const updatedSettings = { ...settings, theme: newTheme };
    setSettings(updatedSettings);
    window.api?.saveSettings?.(updatedSettings);
  };

  return (
    <div className="app-shell">
      <TitleBar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        settings={settings}
        onThemeToggle={handleQuickThemeToggle}
      />
      <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">
        <div style={{ display: currentPage === 'dashboard' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <DashboardPage
            settings={settings}
            onNavigate={setCurrentPage}
          />
        </div>
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
        <div style={{ display: currentPage === 'translation' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <TranslationPage
            settings={settings}
            onNavigateToSettings={() => setCurrentPage('settings')}
            onSendToEditor={handleSendToEditor}
          />
        </div>
        <div style={{ display: currentPage === 'analysis' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <AnalysisPage settings={settings} />
        </div>
        <div style={{ display: currentPage === 'detector' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <DetectorPage settings={settings} />
        </div>
        <div style={{ display: currentPage === 'settings' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <SettingsPage settings={settings} onSettingsChange={setSettings} />
        </div>
        <div style={{ display: currentPage === 'about' ? 'flex' : 'none', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          <AboutPage />
        </div>
      </main>
    </div>
    </div>
  );
}

export default App;
