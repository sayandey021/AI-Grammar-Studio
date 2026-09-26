import fs from 'fs';
import path from 'path';

export class Storage {
  private userDataPath: string;
  private settingsFile: string;
  private historyFile: string;

  constructor(customUserDataPath?: string) {
    if (customUserDataPath) {
      this.userDataPath = customUserDataPath;
    } else {
      const { app } = require('electron');
      this.userDataPath = app.getPath('userData');
    }
    this.settingsFile = path.join(this.userDataPath, 'settings.json');
    this.historyFile = path.join(this.userDataPath, 'history.json');
  }

  private readJson(filePath: string, defaultData: any): any {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
    return defaultData;
  }

  private writeJson(filePath: string, data: any): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
    }
  }

  public getSettings() {
    const settings = this.readJson(this.settingsFile, {
      theme: 'system',
      defaultStartupPage: 'editor',
      creativeTone: 'creative',
      defaultMode: 'quick',
      defaultTone: 'professional',
      customDictionary: [],
      activeGrammarModelId: 'flan-t5-base',
      activeCreativeModelId: 'qwen3-0.6b',
      activeTranslationModelId: 'm2m100-418m',
      executionDevice: 'auto'
    });
    
    // Backwards compatibility migration & category sanitization
    if (settings.activeModelId) {
      if (!settings.activeGrammarModelId) settings.activeGrammarModelId = settings.activeModelId;
      if (!settings.activeCreativeModelId) settings.activeCreativeModelId = 'qwen3-0.6b';
      delete settings.activeModelId;
      this.writeJson(this.settingsFile, settings);
    }

    if (settings.activeGrammarModelId === 't5-large') {
      settings.activeGrammarModelId = 'flan-t5-large';
      this.writeJson(this.settingsFile, settings);
    } else if (!settings.activeGrammarModelId || settings.activeGrammarModelId === 'coedit-large' || settings.activeGrammarModelId === 'vennify-t5-base' || settings.activeGrammarModelId === 'flan-t5-small') {
      settings.activeGrammarModelId = 'flan-t5-base';
      this.writeJson(this.settingsFile, settings);
    }

    if (!settings.activeCreativeModelId || settings.activeCreativeModelId.startsWith('flan-t5') || settings.activeCreativeModelId === 'qwen-0.5b' || settings.activeCreativeModelId === 'deepseek-r1-1.5b') {
      settings.activeCreativeModelId = 'qwen3-0.6b';
      this.writeJson(this.settingsFile, settings);
    }

    if (!settings.activeTranslationModelId || settings.activeTranslationModelId === 'nllb-200-distilled-600m' || settings.activeTranslationModelId.startsWith('opus')) {
      settings.activeTranslationModelId = 'm2m100-418m';
      this.writeJson(this.settingsFile, settings);
    }

    if (!settings.defaultStartupPage) {
      settings.defaultStartupPage = 'editor';
      this.writeJson(this.settingsFile, settings);
    }

    if (!settings.creativeTone) {
      settings.creativeTone = 'creative';
      this.writeJson(this.settingsFile, settings);
    }
    
    return settings;
  }

  public saveSettings(settings: any) {
    this.writeJson(this.settingsFile, settings);
  }

  public getHistory() {
    return this.readJson(this.historyFile, []);
  }

  public saveHistory(history: any) {
    this.writeJson(this.historyFile, history);
  }
}
