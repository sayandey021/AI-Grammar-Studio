import { parentPort, workerData } from 'worker_threads';
import { ModelManager } from './models/ModelManager';
import { AIGrammarEngine } from './grammar/AIGrammarEngine';

if (!parentPort) {
  throw new Error('This file must be run as a worker thread.');
}

const { userDataPath } = workerData;

// Initialize components without relying on Electron's app module
const modelManager = new ModelManager(userDataPath);
const aiEngine = new AIGrammarEngine(modelManager, userDataPath);

parentPort.on('message', async (message: any) => {
  const { id, type, payload } = message;

  try {
    switch (type) {
      case 'check':
        const checkResult = await aiEngine.check(payload.text, { tone: payload.tone });
        parentPort?.postMessage({ id, type: 'success', data: checkResult });
        break;

      case 'analyze':
        const analyzeResult = await aiEngine.analyze(payload.text, payload.action);
        parentPort?.postMessage({ id, type: 'success', data: analyzeResult });
        break;

      case 'generatePrompt':
        const promptResult = await aiEngine.generatePrompt(payload.prompt, (chunk: string) => {
          parentPort?.postMessage({ id, type: 'stream', chunk });
        }, payload.options);
        parentPort?.postMessage({ id, type: 'success', data: promptResult });
        break;

      case 'abortPrompt':
        aiEngine.abortGeneration();
        parentPort?.postMessage({ id, type: 'success' });
        break;

      case 'downloadModel':
        const downloadResult = await modelManager.downloadModel(payload.modelId, (progress) => {
          parentPort?.postMessage({ id, type: 'download-progress', progress, modelId: payload.modelId });
        });
        parentPort?.postMessage({ id, type: 'success', data: downloadResult });
        break;

      case 'deleteModel':
        if (typeof aiEngine.dispose === 'function') {
          await aiEngine.dispose();
        }
        const deleteResult = await modelManager.deleteModel(payload.modelId);
        parentPort?.postMessage({ id, type: 'success', data: deleteResult });
        break;
        
      case 'getModelStatus':
        const statusResult = await modelManager.getStatus(payload.modelId);
        parentPort?.postMessage({ id, type: 'success', data: statusResult });
        break;

      case 'cleanup':
        modelManager.cleanupOnStartup();
        parentPort?.postMessage({ id, type: 'success' });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error: any) {
    parentPort?.postMessage({ id, type: 'error', error: error?.message || String(error) });
  }
});
