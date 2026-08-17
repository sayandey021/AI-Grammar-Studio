import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import { join } from 'path';
import fs from 'fs';
import { Worker } from 'worker_threads';
import { Storage } from './storage';
import { QuickGrammarEngine } from './grammar/QuickGrammarEngine';
import { ModelManager } from './models/ModelManager';

// Remove the default application menu bar (File, Edit, View, Window)
Menu.setApplicationMenu(null);

// Raise the V8 heap limit for the main process so large ONNX model loading doesn't OOM
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');


let mainWindow: BrowserWindow | null = null;
const storage = new Storage();
const modelManager = new ModelManager();
const quickEngine = new QuickGrammarEngine(storage);

let aiWorker: Worker;
let workerJobId = 0;
let workerRestarting = false;
const workerResolvers = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();

function sendToWorker(type: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++workerJobId;
    workerResolvers.set(id, { resolve, reject });
    aiWorker.postMessage({ id, type, payload });
  });
}

function spawnWorker(userDataPath: string) {
  try {
    aiWorker = new Worker(join(__dirname, 'aiWorker.js'), {
      workerData: { userDataPath },
      // Raise V8 heap cap so large ONNX models (e.g. Qwen 1.5B ~1.7GB) don't OOM the thread
      resourceLimits: { maxOldGenerationSizeMb: 4096 }
    });

    aiWorker.on('message', (msg) => {
      if (msg.type === 'stream') {
        if (mainWindow) mainWindow.webContents.send('prompt-stream-chunk', msg.chunk);
      } else if (msg.type === 'download-progress') {
        if (mainWindow) mainWindow.webContents.send('model-download-progress', msg.modelId, msg.progress);
      } else if (msg.type === 'success') {
        const resolver = workerResolvers.get(msg.id);
        if (resolver) {
          resolver.resolve(msg.data);
          workerResolvers.delete(msg.id);
        }
      } else if (msg.type === 'error') {
        const resolver = workerResolvers.get(msg.id);
        if (resolver) {
          resolver.reject(new Error(msg.error || 'Worker operation failed'));
          workerResolvers.delete(msg.id);
        }
      }
    });

    aiWorker.on('error', (err) => {
      console.error('[AI Worker Error]:', err);
      for (const [id, resolver] of workerResolvers.entries()) {
        resolver.reject(err);
        workerResolvers.delete(id);
      }
    });

    aiWorker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`[AI Worker] Worker stopped unexpectedly with exit code ${code}`);
        // Reject all pending promises so the UI doesn't hang
        for (const [id, resolver] of workerResolvers.entries()) {
          resolver.reject(new Error(`AI worker crashed (code ${code}). Please try again.`));
          workerResolvers.delete(id);
        }
        // Notify the renderer that the worker crashed
        if (mainWindow) {
          mainWindow.webContents.send('prompt-stream-error', `AI worker ran out of memory while loading the model. Try a smaller model (e.g. Qwen 0.5B) from Settings.`);
        }
        // Auto-restart worker after a short delay so app stays functional
        if (!workerRestarting) {
          workerRestarting = true;
          setTimeout(() => {
            console.log('[AI Worker] Restarting worker...');
            spawnWorker(userDataPath);
            workerRestarting = false;
          }, 2000);
        }
      } else {
        for (const [id, resolver] of workerResolvers.entries()) {
          resolver.reject(new Error(`Worker exited with code ${code}`));
          workerResolvers.delete(id);
        }
      }
    });
  } catch (err) {
    console.error('[AI Worker Init Failure]:', err);
  }
}

function getAppIcon(): string | undefined {
  const candidates = [
    join(app.getAppPath(), 'assets', 'icon.ico'),
    join(app.getAppPath(), 'assets', 'icon.png'),
    join(process.resourcesPath, 'assets', 'icon.ico'),
    join(process.resourcesPath, 'assets', 'icon.png'),
    join(__dirname, '../../assets/icon.ico'),
    join(__dirname, '../../assets/icon.png'),
    join(process.cwd(), 'assets', 'icon.ico'),
    join(process.cwd(), 'assets', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function createWindow() {
  const iconPath = getAppIcon();
  mainWindow = new BrowserWindow({
    title: 'AI Grammar Studio',
    icon: iconPath,
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenu(null);
  if (typeof (mainWindow as any).removeMenu === 'function') {
    (mainWindow as any).removeMenu();
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set Windows AppUserModelId so Windows Taskbar pins and icons sync with app identity
  if (process.platform === 'win32') {
    app.setAppUserModelId('Saayan.AIGrammerStudio');
  }

  // Initialize AI Worker with auto-restart on crash
  spawnWorker(app.getPath('userData'));
  // Force-delete any model files that were locked last session
  sendToWorker('cleanup').catch(console.error);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (aiWorker) {
    try {
      aiWorker.terminate();
    } catch (e) {
      console.error('Error terminating AI worker:', e);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-settings', async () => {
  return storage.getSettings();
});

ipcMain.handle('save-settings', async (_, settings) => {
  return storage.saveSettings(settings);
});

ipcMain.handle('get-gpu-info', async () => {
  try {
    const gpuInfo = await app.getGPUInfo('basic');
    const devices: Array<{ vendor: string; model: string; type: string }> = [];
    
    if (gpuInfo && Array.isArray((gpuInfo as any).gpuDevice)) {
      for (const dev of (gpuInfo as any).gpuDevice) {
        const vendorId = (dev.vendorId || 0).toString(16).toLowerCase();
        let vendorName = 'Graphics Card';
        let type = 'other';

        if (vendorId.includes('10de') || /nvidia/i.test(dev.driverVendor || '')) {
          vendorName = 'NVIDIA';
          type = 'nvidia';
        } else if (vendorId.includes('1002') || vendorId.includes('1022') || /amd|radeon|advanced micro/i.test(dev.driverVendor || '')) {
          vendorName = 'AMD';
          type = 'amd';
        } else if (vendorId.includes('8086') || /intel/i.test(dev.driverVendor || '')) {
          vendorName = 'Intel';
          type = 'intel';
        }

        devices.push({
          vendor: vendorName,
          model: dev.driverVendor ? `${vendorName} (${dev.driverVendor})` : `${vendorName} GPU`,
          type
        });
      }
    }

    return {
      devices,
      hasNvidia: devices.some(d => d.type === 'nvidia'),
      hasAmd: devices.some(d => d.type === 'amd'),
      hasIntel: devices.some(d => d.type === 'intel')
    };
  } catch (err) {
    console.warn('[GPU Detection] Error getting GPU info:', err);
    return { devices: [], hasNvidia: false, hasAmd: false, hasIntel: false };
  }
});

ipcMain.handle('add-custom-word', async (_, word) => {
  const settings = storage.getSettings();
  if (!settings.customDictionary) {
    settings.customDictionary = [];
  }
  if (!settings.customDictionary.includes(word)) {
    settings.customDictionary.push(word);
    storage.saveSettings(settings);
    quickEngine.addCustomWord(word);
  }
  return settings.customDictionary;
});

ipcMain.handle('remove-custom-word', async (_, word) => {
  const settings = storage.getSettings();
  if (settings.customDictionary) {
    settings.customDictionary = settings.customDictionary.filter((w: string) => w !== word);
    storage.saveSettings(settings);
    quickEngine.removeCustomWord(word);
  }
  return settings.customDictionary;
});

ipcMain.handle('get-history', async () => {
  return storage.getHistory();
});

ipcMain.handle('save-history', async (_, history) => {
  return storage.saveHistory(history);
});

ipcMain.handle('get-model-status', async (_, modelId: string) => {
  return sendToWorker('getModelStatus', { modelId });
});

ipcMain.handle('download-model', async (_, modelId: string) => {
  return sendToWorker('downloadModel', { modelId });
});

ipcMain.handle('delete-model', async (_, modelId: string) => {
  return sendToWorker('deleteModel', { modelId });
});

ipcMain.handle('open-model-location', async (_, modelId: string) => {
  const modelDir = modelManager.getModelPath(modelId);
  const rootDir = modelManager.getModelsRootDir();
  const userData = app.getPath('userData');

  if (fs.existsSync(modelDir)) {
    await shell.openPath(modelDir);
  } else if (fs.existsSync(rootDir)) {
    await shell.openPath(rootDir);
  } else {
    if (!fs.existsSync(userData)) {
      fs.mkdirSync(userData, { recursive: true });
    }
    await shell.openPath(userData);
  }
  return { success: true };
});

ipcMain.handle('check-grammar', async (_, { text, mode, tone }) => {
  try {
    if (mode === 'ai') {
      return await sendToWorker('check', { text, tone });
    } else {
      return await quickEngine.check(text);
    }
  } catch (error: any) {
    console.error('Grammar check error:', error);
    throw new Error(error.message);
  }
});

ipcMain.handle('analyze-grammar', async (_, { text, action }) => {
  try {
    if (action === 'pos' || action === 'tense' || action === 'clause') {
      return await quickEngine.analyze(text, action);
    } else if (action === 'voice' || action === 'narration' || action === 'degree') {
      const quickResult = await quickEngine.analyze(text, action);
      try {
        const aiResult = await sendToWorker('analyze', { text, action });
        if (aiResult && aiResult.type !== 'error' && aiResult.data) {
          if (action === 'degree') {
            // Parse the structured "Positive: [x] | Comparative: [y] | Superlative: [z]" output
            const newTransformations: any[] = [];
            const parts = aiResult.data.split('|');
            for (const part of parts) {
              const match = part.match(/(Positive|Comparative|Superlative):\s*(.*)/i);
              if (match && match[2].trim()) {
                newTransformations.push({ degree: match[1], text: match[2].trim() });
              }
            }
            if (newTransformations.length > 0) {
              quickResult.transformations = newTransformations;
              quickResult.isAiEnhanced = true;
            }
          } else {
            const aiTextCleaned = aiResult.data.toLowerCase().replace(/[^a-z0-9]/g, '');
            const originalCleaned = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Check if the AI returned a prompt instruction echo or invalid meta-response
            const isInstructionEcho = /^(change|convert|rewrite|transform)\b/i.test(aiResult.data.trim()) ||
                                      /active voice|passive voice|direct speech|indirect speech/i.test(aiResult.data.trim());

            // Check if the quick engine already produced a valid conversion
            const quickSucceeded = quickResult.convertedText && 
                                   quickResult.convertedText.toLowerCase().replace(/[^a-z0-9]/g, '') !== originalCleaned &&
                                   !quickResult.convertedText.includes('Could not');

            // Only override if quick engine didn't produce a valid conversion AND AI gave a valid sentence
            if (!quickSucceeded && !isInstructionEcho && aiTextCleaned !== originalCleaned) {
              quickResult.convertedText = aiResult.data;
              quickResult.isAiEnhanced = true;
            }
          }
        } else if (aiResult && aiResult.type === 'error' && action === 'degree' && quickResult.originalDegree === 'Unknown') {
          // If the offline engine failed and the AI model isn't downloaded, tell the user!
          quickResult.explanation = `${quickResult.explanation}\n\n⚠️ AI Enhancement Skipped: ${aiResult.data}`;
        }
      } catch (aiErr) {
        console.warn(`AI enhancement failed for ${action}, falling back to quick engine rule:`, aiErr);
      }
      return quickResult;
    }
    throw new Error('Unknown analysis action');
  } catch (error: any) {
    console.error('Analysis error:', error);
    throw new Error(error.message);
  }
});

ipcMain.handle('generate-ai-prompt', async (_, prompt: string, options?: any) => {
  // Fire generation asynchronously so stream chunks flow immediately
  sendToWorker('generatePrompt', { prompt, options })
    .then((result: string) => {
      // Send full result alongside done — frontend uses this as fallback
      // if the model didn't emit any stream chunks (e.g. flan-t5 models)
      if (mainWindow) mainWindow.webContents.send('prompt-stream-done', result || '');
    })
    .catch((err: any) => {
      if (mainWindow) mainWindow.webContents.send('prompt-stream-error', err?.message || 'Generation failed.');
    });
  return null; // Return immediately – frontend listens to stream events
});

ipcMain.handle('abort-ai-prompt', async () => {
  return sendToWorker('abortPrompt', {});
});

