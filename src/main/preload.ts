import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getGpuInfo: () => ipcRenderer.invoke('get-gpu-info'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveHistory: (history: any) => ipcRenderer.invoke('save-history', history),
  getModelStatus: (modelId: string) => ipcRenderer.invoke('get-model-status', modelId),
  downloadModel: (modelId: string) => ipcRenderer.invoke('download-model', modelId),
  deleteModel: (modelId: string) => ipcRenderer.invoke('delete-model', modelId),
  openModelLocation: (modelId: string) => ipcRenderer.invoke('open-model-location', modelId),
  onModelProgress: (callback: (modelId: string, progress: number) => void) => {
    const handler = (_: any, modelId: string, progress: number) => callback(modelId, progress);
    ipcRenderer.on('model-download-progress', handler);
    return () => ipcRenderer.removeListener('model-download-progress', handler);
  },
  onModelDeleted: (callback: (modelId: string) => void) => {
    const handler = (_: any, modelId: string) => callback(modelId);
    ipcRenderer.on('model-deleted', handler);
    return () => ipcRenderer.removeListener('model-deleted', handler);
  },
  checkGrammar: (text: string, mode: 'quick' | 'ai', tone?: string) => 
    ipcRenderer.invoke('check-grammar', { text, mode, tone }),
  addCustomWord: (word: string) => ipcRenderer.invoke('add-custom-word', word),
  removeCustomWord: (word: string) => ipcRenderer.invoke('remove-custom-word', word),
  analyzeGrammar: (text: string, action: string) => ipcRenderer.invoke('analyze-grammar', { text, action }),
  generateAiPrompt: (prompt: string, options?: any) => ipcRenderer.invoke('generate-ai-prompt', prompt, options),
  abortAiPrompt: () => ipcRenderer.invoke('abort-ai-prompt'),
  onPromptStreamChunk: (callback: (chunk: string) => void) => {
    const handler = (_: any, chunk: string) => callback(chunk);
    ipcRenderer.on('prompt-stream-chunk', handler);
    return () => ipcRenderer.removeListener('prompt-stream-chunk', handler);
  },
  onPromptDone: (callback: (fullText: string) => void) => {
    const handler = (_: any, fullText: string) => callback(fullText || '');
    ipcRenderer.on('prompt-stream-done', handler);
    return () => ipcRenderer.removeListener('prompt-stream-done', handler);
  },
  onPromptError: (callback: (err: string) => void) => {
    const handler = (_: any, err: string) => callback(err);
    ipcRenderer.on('prompt-stream-error', handler);
    return () => ipcRenderer.removeListener('prompt-stream-error', handler);
  },
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  detectPlagiarismAi: (payload: { text: string; onlineMode?: boolean; referenceText?: string }) =>
    ipcRenderer.invoke('detect-plagiarism-ai', payload),
  exportReportPdf: (payload: { htmlContent: string; title?: string }) =>
    ipcRenderer.invoke('export-report-pdf', payload),
  exportReportHtml: (payload: { htmlContent: string; title?: string }) =>
    ipcRenderer.invoke('export-report-html', payload),
  readReferenceFile: () => ipcRenderer.invoke('read-reference-file'),
  translateText: (payload: { text: string; sourceLang: string; targetLang: string; modelId?: string }) =>
    ipcRenderer.invoke('translate-text', payload),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: any, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window-maximized-change', handler);
    return () => ipcRenderer.removeListener('window-maximized-change', handler);
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
