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

const getInitialSettings = (): any => {
  try {
    const sync = window.api?.getSettingsSync?.() || window.api?.initialSettings;
    if (sync) return sync;
    const cached = localStorage.getItem('app_settings');
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Error reading initial settings:', e);
  }
  return null;
};

const getInitialStartupPage = (initialSettings?: any): Page => {
  try {
    const s = initialSettings || getInitialSettings();
    if (s?.defaultStartupPage) {
      return s.defaultStartupPage as Page;
    }
    const cachedPage = localStorage.getItem('app_startup_page');
    if (cachedPage) return cachedPage as Page;
    const cachedSettings = localStorage.getItem('app_settings');
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      if (parsed?.defaultStartupPage) return parsed.defaultStartupPage as Page;
    }
  } catch (e) {
    console.warn('Error reading initial startup page:', e);
  }
  return 'editor';
};

// Immediate theme application on script load to prevent theme flash
try {
  const init = getInitialSettings();
  const initTheme = init?.theme || 'system';
  const shouldBeDark = initTheme === 'dark' ? true : initTheme === 'light' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (shouldBeDark) {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
} catch {}

function App() {
  const [settings, setSettings] = useState<any>(() => getInitialSettings());
  const [currentPage, setCurrentPage] = useState<Page>(() => getInitialStartupPage(settings));

  useEffect(() => {
    // Refresh / load settings on startup and keep local cache synchronized
    window.api?.getSettings().then((s: any) => {
      if (s) {
        setSettings(s);
        try {
          localStorage.setItem('app_settings', JSON.stringify(s));
          if (s.defaultStartupPage) {
            localStorage.setItem('app_startup_page', s.defaultStartupPage);
          }
        } catch {}
      }
    });
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

  const handleSettingsChange = (newSettings: any) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('app_settings', JSON.stringify(newSettings));
      if (newSettings?.defaultStartupPage) {
        localStorage.setItem('app_startup_page', newSettings.defaultStartupPage);
      }
    } catch {}
  };

  const handleQuickThemeToggle = () => {
    const isDark = document.documentElement.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    const updatedSettings = { ...settings, theme: newTheme };
    setSettings(updatedSettings);
    try {
      localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
    } catch {}
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
          <SettingsPage settings={settings} onSettingsChange={handleSettingsChange} />
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
