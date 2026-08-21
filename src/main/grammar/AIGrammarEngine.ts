import { GrammarProvider, GrammarResult, Suggestion } from './GrammarProvider';
import { ModelManager, AVAILABLE_MODELS, ModelConfig } from '../models/ModelManager';
import { Storage } from '../storage';
import { QuickGrammarEngine, applySuggestionsToText } from './QuickGrammarEngine';
import path from 'path';
import fs from 'fs';

const SLANG_MAP: Record<string, string> = {
  'r': 'are',
  'u': 'you',
  'ur': 'your',
  'pls': 'please',
  'plz': 'please',
  'thx': 'thanks',
  'b4': 'before',
  'gr8': 'great',
  'idk': 'I do not know',
  'imo': 'in my opinion',
  'im': 'I am',
  'cant': 'cannot',
  'wont': 'will not',
  'shouldnt': 'should not',
  'couldnt': 'could not',
  'wouldnt': 'would not',
  'isnt': 'is not',
  'arent': 'are not',
  'wasnt': 'was not',
  'werent': 'were not',
  'dont': 'do not',
  'doesnt': 'does not',
  'didnt': 'did not'
};

function normalizeSlang(text: string): string {
  return text.split(/(\s+)/).map(token => {
    const lower = token.toLowerCase().replace(/[^a-z]/g, '');
    if (SLANG_MAP[lower]) {
      return token.replace(new RegExp(`\\b${lower}\\b`, 'i'), SLANG_MAP[lower]);
    }
    return token;
  }).join('');
}

function formatSentence(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return '';
  
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  const isQuestion = /^(Are|Is|Can|Could|Would|Will|What|Why|How|Who|Where|Do|Does|Did|Shall|Should|May|Might)\b/i.test(cleaned);
  if (isQuestion && !cleaned.endsWith('?')) {
    cleaned = cleaned.replace(/[.,]?$/, '?');
  } else if (!isQuestion && !/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }
  return cleaned;
}

function isHallucinatedOrInvalid(originalText: string, rewriteText: string): boolean {
  if (!rewriteText || rewriteText.trim().length < 2) return true;

  const rawLower = rewriteText.toLowerCase().trim();

  // 1. Check if output leaks system instructions or prompt boilerplate
  if (/fix grammar|instruction:|system:|user:|assistant:|<\|im_start\|>|<start_of_turn>|\[instance\]/i.test(rewriteText)) {
     return true;
  }

  // 2. Tokenize words
  const origWords = originalText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  const rewriteWords = rawLower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);

  if (origWords.length === 0 || rewriteWords.length === 0) return true;

  // 3. Word ratio check: rewrite shouldn't explode in length or shrink to nothing unexpectedly
  if (origWords.length >= 3 && (rewriteWords.length > origWords.length * 3 || rewriteWords.length < Math.floor(origWords.length / 3))) {
     return true;
  }

  // 4. Word overlap check for sentences with 3+ words
  const origSig = origWords.filter(w => w.length >= 3);
  if (origSig.length >= 3) {
    let matches = 0;
    for (const ot of origSig) {
       if (rewriteWords.some(rt => rt.includes(ot.slice(0, 3)) || ot.includes(rt.slice(0, 3)))) {
          matches++;
       }
    }
    const overlapRatio = matches / origSig.length;
    if (overlapRatio < 0.20) {
       return true;
    }
  }

  // 5. Repetitive phrase loop check (e.g. "a snaft and a snaft")
  if (rewriteWords.length >= 4) {
     const uniqueWords = new Set(rewriteWords);
     if (uniqueWords.size <= 2) {
        return true;
     }
     const half = Math.floor(rewriteWords.length / 2);
     const firstHalf = rewriteWords.slice(0, half).join(' ');
     const secondHalf = rewriteWords.slice(half, half * 2).join(' ');
     if (firstHalf === secondHalf) {
        return true;
     }
  }

  // 6. If the model didn't change anything (or only changed punctuation), treat it as a fallback trigger
  // so the Quick Grammar Engine can do a pass. If the text is actually perfect,
  // the Quick Grammar Engine will also make no changes.
  const stripPunctuation = (str: string) => str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();
  if (stripPunctuation(originalText) === stripPunctuation(rewriteText)) {
     return true;
  }

  return false;
}

export class AIGrammarEngine implements GrammarProvider {
  private modelManager: ModelManager;
  private storage: Storage;
  private quickEngine: QuickGrammarEngine;
  private pipeline: any = null;
  private activeModelId: string | null = null;
  private activeExecutionDevice: string | null = null;
  private abortCurrentGeneration: boolean = false;

  public abortGeneration() {
    this.abortCurrentGeneration = true;
  }

  constructor(modelManager: ModelManager, userDataPath?: string) {
    this.modelManager = modelManager;
    this.storage = new Storage(userDataPath);
    this.quickEngine = new QuickGrammarEngine(this.storage);
  }

  private getActiveModelConfig(mode: 'grammar' | 'creative'): ModelConfig {
    const settings = this.storage.getSettings();
    let id = mode === 'grammar' 
      ? (settings.activeGrammarModelId || 'flan-t5-base') 
      : (settings.activeCreativeModelId || 'qwen3-0.6b');
    
    // Safely map legacy or removed model IDs to available ONNX model IDs
    if (id === 'qwen-2.5-0.5b' || id === 'qwen-0.5b') id = 'qwen3-0.6b';
    if (id === 'gemma-2-2b' || id === 'gemma-1b') id = 'gemma-3-1b';
    if (id === 'vennify-t5-base') id = 'flan-t5-large';
    if (id === 'aventiq-t5-small' || id === 'flan-t5-small') id = 'flan-t5-base';

    // Strictly enforce category matching: Creative tasks MUST use Creative models, Grammar tasks MUST use Grammar models
    let found = AVAILABLE_MODELS.find(m => m.id === id && m.category === mode);
    if (!found) {
      found = AVAILABLE_MODELS.find(m => m.category === mode) || AVAILABLE_MODELS[0];
    }
    return found;
  }

  private async getPipeline(modelConfig: ModelConfig) {
    const settings = this.storage.getSettings();
    const targetDevice = settings.executionDevice || 'auto';

    if (this.pipeline && (this.activeModelId !== modelConfig.id || this.activeExecutionDevice !== targetDevice)) {
       await this.dispose();
    }

    if (!this.pipeline) {
      // Unset HF tokens to prevent 401 Unauthorized errors on public models due to expired local tokens
      delete process.env.HF_TOKEN;
      delete process.env.HF_ACCESS_TOKEN;

      const dynamicImport = new Function('specifier', 'return import(specifier)');
      let transformers;
      try {
        transformers = await dynamicImport('@xenova/transformers');
      } catch (err: any) {
        if (err.message && err.message.includes('specified module could not be found')) {
          throw new Error('Failed to load AI Engine. This is likely because Microsoft Visual C++ Redistributable is missing on this machine. Please install it to use AI features.');
        }
        throw err;
      }
      const { pipeline, env, Tensor, AutoModelForCausalLM, AutoModelForSeq2SeqLM, AutoTokenizer, AutoProcessor } = transformers;

      // Map unsupported model architectures to supported ones before loading
      const mapArchitectures = (MappingClass: any, fromKey: string, toKey: string) => {
        if (!MappingClass) return;
        const mapping = MappingClass.MODEL_CLASS_MAPPINGS || MappingClass.TOKENIZER_CLASS_MAPPING || MappingClass.PROCESSOR_CLASS_MAPPING;
        if (!mapping) return;
        
        if (Array.isArray(mapping)) {
           for (const m of mapping) {
             if (m instanceof Map && m.has(fromKey) && !m.has(toKey)) m.set(toKey, m.get(fromKey));
           }
        } else if (mapping instanceof Map) {
           if (mapping.has(fromKey) && !mapping.has(toKey)) mapping.set(toKey, mapping.get(fromKey));
        } else if (typeof mapping === 'object') {
           if (mapping[fromKey] !== undefined && mapping[toKey] === undefined) {
             mapping[toKey] = mapping[fromKey];
           }
        }
      };

      mapArchitectures(AutoModelForCausalLM, 'qwen2', 'qwen3');
      mapArchitectures(AutoModelForSeq2SeqLM, 'qwen2', 'qwen3');
      mapArchitectures(AutoTokenizer, 'qwen2', 'qwen3');
      mapArchitectures(AutoProcessor, 'qwen2', 'qwen3');

      // Compatibility fix for onnxruntime-node: ensure Tensor.prototype.location is defined
      if (Tensor && !Object.getOwnPropertyDescriptor(Tensor.prototype, 'location')) {
        Object.defineProperty(Tensor.prototype, 'location', {
          get() { return this.dataLocation || 'cpu'; },
          configurable: true,
          enumerable: true
        });
      }

      const modelsDir = this.modelManager.getModelsRootDir();
      env.cacheDir = modelsDir;
      env.localModelPath = modelsDir;
      env.allowRemoteModels = false; // Runtime is offline-only
      env.allowLocalModels = true;

      // Determine pipeline options based on user hardware device preference
      const pipelineOptions: any = {};
      if (targetDevice === 'cuda') {
        pipelineOptions.executionProviders = ['cuda', 'cpu'];
        pipelineOptions.device = 'cuda';
      } else if (targetDevice === 'directml') {
        pipelineOptions.executionProviders = ['directml', 'cpu'];
        pipelineOptions.device = 'directml';
      } else if (targetDevice === 'webgpu') {
        pipelineOptions.device = 'webgpu';
      } else if (targetDevice === 'cpu') {
        pipelineOptions.executionProviders = ['cpu'];
        pipelineOptions.device = 'cpu';
      } else {
        // 'auto': Try GPU DirectML acceleration on Windows, otherwise CPU
        if (process.platform === 'win32') {
          pipelineOptions.executionProviders = ['directml', 'cpu'];
          pipelineOptions.device = 'directml';
        } else {
          pipelineOptions.executionProviders = ['cpu'];
          pipelineOptions.device = 'cpu';
        }
      }

      if (modelConfig.repo.includes('onnx-community')) {
        if (modelConfig.type !== 'text2text-generation') {
          let modelFileName = modelConfig.modelFileName || 'model';
          const modelPath = this.modelManager.getModelPath(modelConfig.id);
          const onnxDir = path.join(modelPath, 'onnx');
          if (modelFileName === 'model_q4' && !fs.existsSync(path.join(onnxDir, 'model_q4.onnx')) && fs.existsSync(path.join(onnxDir, 'model_quantized.onnx'))) {
            modelFileName = 'model_quantized';
          } else if (modelFileName === 'model_quantized' && !fs.existsSync(path.join(onnxDir, 'model_quantized.onnx')) && fs.existsSync(path.join(onnxDir, 'model_q4.onnx'))) {
            modelFileName = 'model_q4';
          }
          pipelineOptions.model_file_name = modelFileName;
          // Disable the auto `_quantized` suffix so the exact filename is used
          if (modelFileName) {
            pipelineOptions.quantized = false;
          }
          if (modelFileName.includes('f16') || modelFileName.includes('fp16')) {
            pipelineOptions.dtype = 'fp16';
          }
        }
      } else if (modelConfig.id === 'coedit-large') {
        pipelineOptions.quantized = false;
      }

      try {
        this.pipeline = await pipeline(modelConfig.type, modelConfig.repo, pipelineOptions);
      } catch (gpuErr) {
        console.warn(`[AIGrammarEngine] Could not initialize pipeline with device '${targetDevice}', falling back to CPU:`, gpuErr);
        const cpuOptions = { ...pipelineOptions, executionProviders: ['cpu'], device: 'cpu' };
        this.pipeline = await pipeline(modelConfig.type, modelConfig.repo, cpuOptions);
      }

      // If model defines an explicit head_dim (like Gemma 3 or Gemma 2), ensure dim_kv matches
      if (this.pipeline?.model?.config?.head_dim) {
        this.pipeline.model.dim_kv = this.pipeline.model.config.head_dim;
      }

      this.activeModelId = modelConfig.id;
      this.activeExecutionDevice = targetDevice;
    }
    return this.pipeline;
  }

  public async dispose() {
    if (this.pipeline) {
      try {
        if (typeof this.pipeline.dispose === 'function') {
          await this.pipeline.dispose();
        }
      } catch (e) {}
      this.pipeline = null;
      this.activeModelId = null;
      this.activeExecutionDevice = null;
    }
  }

  private formatPrompt(modelConfig: ModelConfig, instruction: string, input: string, options?: any): string {
     if (modelConfig.type === 'text-generation') {
        const isCreative = options?.mode === 'creative';
        const isThinkingEnabled = options?.isThinkingEnabled !== false;

        let sysMsg = '';
        if (isCreative) {
          if (modelConfig.supportsThinking && isThinkingEnabled) {
            sysMsg = "You are a thoughtful and creative AI assistant. You may think and reason step-by-step before producing your final creative response.";
          } else {
            sysMsg = "You are a creative writing assistant. STRICT RULES: (1) Write ONLY in English. (2) Output ONLY the requested creative content — no preamble, no commentary, no self-reference. (3) Do NOT ask follow-up questions. (4) Do NOT add [End], disclaimers, or meta-tags. (5) Do NOT say you are an AI. (6) For short/casual inputs (e.g. 'hey', 'hi'), reply with a single short friendly sentence. (7) For writing requests, produce well-structured, immersive content. (8) Start your response immediately with the content.";
          }
        } else {
          sysMsg = "You are a concise assistant. STRICT RULES: (1) Reply ONLY in English. (2) Keep answers SHORT and to the point. (3) No filler, no disclaimers, no meta-commentary. (4) For simple questions or greetings, reply in ONE sentence maximum.";
        }

        if (modelConfig.supportsThinking && !isThinkingEnabled) {
           sysMsg += " Do not output any <think> blocks or intermediate reasoning. Provide only the final direct answer.";
        }

        let promptEnd = '';
        if (modelConfig.supportsThinking) {
           if (isThinkingEnabled) {
              promptEnd = "<think>\n";
           } else {
              promptEnd = "<think>\n\n</think>\n";
           }
        }

        // For creative mode, pass the user prompt directly without an instruction prefix
        const userMessage = isCreative ? input : `${instruction}: ${input}`;

        if (modelConfig.id.includes('gemma')) {
           return `<start_of_turn>user\n${sysMsg}\n\n${userMessage}<end_of_turn>\n<start_of_turn>model\n${promptEnd}`;
        } else if (modelConfig.id.includes('llama-3') || modelConfig.id.includes('llama3')) {
           return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${sysMsg}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n${promptEnd}`;
        } else if (modelConfig.id.includes('qwen') || modelConfig.id.includes('deepseek')) {
           return `<|im_start|>system\n${sysMsg}<|im_end|>\n<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n${promptEnd}`;
        }
        return `System: ${sysMsg}\nUser: ${userMessage}\nAssistant:\n${promptEnd}`;
     }

     if (modelConfig.id.includes('coedit')) {
        const lowerInst = instruction.toLowerCase();
        if (lowerInst.includes('formal')) {
           return `Make the sentence formal: ${input}`;
        } else if (lowerInst.includes('casual')) {
           return `Change the style to casual: ${input}`;
        } else if (lowerInst.includes('simple') || lowerInst.includes('concise')) {
           return `Make the sentence simpler: ${input}`;
        } else if (lowerInst.includes('rewrite') || lowerInst.includes('paraphrase')) {
           return `Paraphrase the sentence: ${input}`;
        }
        return `Fix grammatical errors in this sentence: ${input}`;
     }

     if (modelConfig.id === 'flan-t5-base') {
        // This is now onnx-community/t5-base-grammar-correction-ONNX which expects 'grammar: '
        return `grammar: ${input}`;
     }

     if (modelConfig.id.includes('flan-t5') || modelConfig.id.includes('jonawhisper') || modelConfig.type === 'seq2seq-lm') {
        if (instruction.toLowerCase().includes('tone') || instruction.toLowerCase().includes('concise')) {
           return `Rewrite this sentence to be ${instruction.split(' ').pop()} and grammatically correct: ${input}`;
        }
        return `Please correct the grammar, spelling, capitalization, and punctuation of this sentence: ${input}`;
     }

     return `${instruction}: ${input}`;
  }

  private extractOutput(modelConfig: ModelConfig, rawOutput: string, prompt: string, _options?: any): string {
     if (modelConfig.type === 'text-generation') {
        let output = rawOutput;

        // ── Step 1: Strip the prompt echo if present ──────────────────────────
        if (output.startsWith(prompt)) {
           output = output.slice(prompt.length);
        }

        // ── Step 2: Extract only the assistant's turn ─────────────────────────
        if (output.includes('<|start_header_id|>assistant<|end_header_id|>\n\n')) {
           output = output.split('<|start_header_id|>assistant<|end_header_id|>\n\n').pop() || '';
        } else if (output.includes('<|start_header_id|>assistant<|end_header_id|>')) {
           output = output.split('<|start_header_id|>assistant<|end_header_id|>').pop() || '';
        } else if (output.includes('<start_of_turn>model\n')) {
           output = output.split('<start_of_turn>model\n').pop() || '';
        } else if (output.includes('<|im_start|>assistant\n')) {
           output = output.split('<|im_start|>assistant\n').pop() || '';
        } else if (output.includes('<|assistant|>\n')) {
           output = output.split('<|assistant|>\n').pop() || '';
        } else if (output.includes('Assistant:')) {
           output = output.split('Assistant:').pop() || '';
        }

        // ── Step 3: Truncate at the next fake user/system turn ────────────────
        // Small models often continue generating a fake dialogue.
        // Cut everything at the first sign of a new turn starting.
        const nextTurnMarkers = [
           '<|im_start|>user',
           '<|im_start|>system',
           '<|start_header_id|>user',
           '<|start_header_id|>system',
           '<start_of_turn>user',
           '<|eot_id|>',
        ];
        for (const marker of nextTurnMarkers) {
           const idx = output.indexOf(marker);
           if (idx !== -1) {
              output = output.slice(0, idx);
           }
        }

        // ── Step 4: Strip all remaining special chat tokens (preserve <think> and </think>)
        output = output
           .replace(/<\|im_end\|>/gs, '')
           .replace(/<\|im_start\|>\w*/gs, '')
           .replace(/<\|(?:endoftext|begin_of_text|eot_id|start_header_id|end_header_id)\w*\|>/gs, '')
           .replace(/<end_of_turn>/g, '')
           .replace(/<eos>/g, '')
           .replace(/<\/s>/g, '');

         // ── Step 5: Strip meta-commentary patterns small models generate ─────
         // e.g. "[End]", "[This was just an example...]", "(Note: ...)", etc.
         const metaMarkers = [
            '[End]', '[end]', '[END]',
            '[This was', '[Note:', '(Note:', '[Disclaimer',
            '\n\n---', '\n---',
            'Note: This', 'Note: I', 'Note: The',
            '(This is', '(This was',
         ];
         for (const marker of metaMarkers) {
            const idx = output.indexOf(marker);
            if (idx !== -1) {
               output = output.slice(0, idx);
            }
         }

         // If the prompt prefilled <think> and output has </think> without opening <think>, prepend it
         if (output.includes('</think>') && !output.includes('<think>')) {
            output = '<think>\n' + output;
         }

         return output.trim();
     }
     return rawOutput.trim();
  }

  async check(text: string, options?: { tone?: string }): Promise<GrammarResult> {
    const tone = options?.tone || 'professional';
    const modelConfig = this.getActiveModelConfig('grammar');

    if (!this.modelManager.isDownloaded(modelConfig.id)) {
      return {
        text,
        suggestions: [],
        rewritePreview: `⚠️ Local AI Model is not installed.\n\nPlease navigate to Settings to download a local AI model.`
      };
    }

    try {
      const generator = await this.getPipeline(modelConfig);
      const cleanedInput = normalizeSlang(text);
      
      const sentenceRegex = /[^.!?\n]+[.!?\n]+|\s*[^.!?\n]+$/g;
      const sentences = cleanedInput.match(sentenceRegex) || [cleanedInput];
      
      let finalRewrite = '';
      
      for (const rawSentence of sentences) {
        const sentence = rawSentence.trim();
        if (!sentence) {
          finalRewrite += rawSentence;
          continue;
        }

        let instruction = 'Fix the grammar of this sentence';
        if (tone === 'professional') instruction = 'Fix grammar and make the tone professional';
        else if (tone === 'friendly') instruction = 'Fix grammar and make the tone friendly';
        else if (tone === 'concise') instruction = 'Fix grammar and make the sentence concise';
        
        let prompt = this.formatPrompt(modelConfig, instruction, sentence);
        const maxTokens = modelConfig.type === 'text-generation' ? 256 : 128;
        
        const genOptions: any = { 
          max_new_tokens: maxTokens,
          temperature: 0.1,
          do_sample: false
        };

        if (modelConfig.type === 'seq2seq-lm' || modelConfig.id.includes('flan-t5')) {
          genOptions.num_beams = 2;
          genOptions.early_stopping = true;
        }

        const output = await generator(prompt, genOptions);
        
        let rawRewrite = output[0]?.generated_text?.trim() || '';
        rawRewrite = this.extractOutput(modelConfig, rawRewrite, prompt);
        
        if (isHallucinatedOrInvalid(sentence, rawRewrite)) {
          const fallbackPrompt = this.formatPrompt(modelConfig, 'Fix grammar', sentence);
          const fallbackOutput = await generator(fallbackPrompt, {
            max_new_tokens: maxTokens,
            temperature: 0.1,
            do_sample: false
          });
          let fallbackRaw = fallbackOutput[0]?.generated_text?.trim() || sentence;
          rawRewrite = this.extractOutput(modelConfig, fallbackRaw, fallbackPrompt);

          // If AI model fallback is still hallucinated/invalid, fall back to rule-based Quick Grammar Engine!
          if (isHallucinatedOrInvalid(sentence, rawRewrite)) {
            try {
              const quickRes = await this.quickEngine.check(sentence);
              rawRewrite = quickRes.rewritePreview && !quickRes.rewritePreview.includes('Perfect!') 
                ? quickRes.rewritePreview 
                : sentence;
            } catch (qErr) {
              rawRewrite = sentence;
            }
          }
        }
        
        let formatted = formatSentence(rawRewrite);
        
        // Pass through quickEngine for high precision spelling check & enhancement
        try {
          const quickEnhancement = await this.quickEngine.check(formatted);
          if (quickEnhancement.suggestions && quickEnhancement.suggestions.length > 0) {
             formatted = applySuggestionsToText(formatted, quickEnhancement.suggestions);
          }
        } catch (e) {}

        const leadingSpace = rawSentence.match(/^\s*/)?.[0] || '';
        const trailingSpace = rawSentence.match(/\s*$/)?.[0] || '';
        const spaceSuffix = trailingSpace.includes('\n') ? trailingSpace : ' ';
        
        finalRewrite += leadingSpace + formatted + spaceSuffix;
      }
      
      let rewrite = finalRewrite.trim();
      const hasChanges = rewrite.toLowerCase() !== text.trim().toLowerCase();

      const suggestions: Suggestion[] = hasChanges ? [
        {
          id: `ai-${Date.now()}`,
          start: 0,
          end: text.length,
          issue: text,
          explanation: `AI-enhanced ${tone} rewrite`,
          replacements: [rewrite],
          type: 'style'
        }
      ] : [];

      return {
        text,
        suggestions,
        rewritePreview: hasChanges ? rewrite : `✨ Perfect! Your sentence "${text}" is already grammatically correct.`
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      return {
        text,
        suggestions: [],
        rewritePreview: `Failed to generate AI rewrite. Error: ${(error as any).message || error}`
      };
    }
  }

  async analyze(text: string, action: string): Promise<{ type: 'success' | 'error', data: string }> {
    const modelConfig = this.getActiveModelConfig('grammar');
    if (!this.modelManager.isDownloaded(modelConfig.id)) {
      return { type: 'error', data: `${modelConfig.name} is not downloaded. Please download it from Settings.` };
    }

    try {
      const generator = await this.getPipeline(modelConfig);
      const cleanedInput = normalizeSlang(text);
      
      let instruction = '';
      if (action === 'voice') instruction = 'Rewrite this sentence in the opposite grammatical voice (active or passive). Output ONLY the final transformed sentence';
      else if (action === 'narration') instruction = 'Rewrite this sentence in the opposite speech style (direct or indirect speech). Output ONLY the final transformed sentence';
      else if (action === 'degree') instruction = 'Convert this sentence into its missing degrees of comparison (positive, comparative, superlative). Format strictly as Positive: [text] | Comparative: [text] | Superlative: [text]';

      const prompt = this.formatPrompt(modelConfig, instruction, cleanedInput, { isThinkingEnabled: false });
      const maxTokens = modelConfig.type === 'text-generation' ? 256 : 128;

      const output = await generator(prompt, { 
        max_new_tokens: maxTokens,
        temperature: 0.1,
        do_sample: false
      });

      let rawRewrite = output[0]?.generated_text?.trim() || '';
      rawRewrite = this.extractOutput(modelConfig, rawRewrite, prompt);

      // Check if output is a prompt echo or meta instruction
      if (/^(rewrite|change|convert|transform)\b/i.test(rawRewrite) || /active voice|passive voice|direct speech|indirect speech/i.test(rawRewrite)) {
        rawRewrite = cleanedInput;
      }

      if (!rawRewrite || rawRewrite.length < 2) {
        rawRewrite = cleanedInput;
      }

      const rewrite = action === 'degree' ? rawRewrite : formatSentence(rawRewrite);
      return { type: 'success', data: rewrite };
    } catch (error: any) {
      console.error(`AI Analysis Error (${action}):`, error);
      return { type: 'error', data: `Failed to generate. Error: ${error.message || error}` };
    }
  }

  async generatePrompt(prompt: string, onStream?: (chunk: string) => void, options?: any): Promise<string> {
    const modelConfig = this.getActiveModelConfig('creative');
    if (!this.modelManager.isDownloaded(modelConfig.id)) {
      throw new Error(`${modelConfig.name} is not downloaded. Please download it from Settings.`);
    }

    let streamBuffer = '';
    let streamAborted = false;
    let formattedPrompt = '';

    try {
      this.abortCurrentGeneration = false;
      const generator = await this.getPipeline(modelConfig);
      
      formattedPrompt = this.formatPrompt(modelConfig, '', prompt, { ...options, mode: 'creative' });
      const maxTokens = modelConfig.type === 'text-generation' ? (modelConfig.supportsThinking ? 1536 : 1024) : 256;

      let startTokenIdx = -1;
      let lastEmittedLength = 0;
      // Regex to strip leftover chat-template tokens from a streamed chunk without stripping <think> or </think>
      const CHAT_TOKEN_RE = /<\|(?:im_start|im_end|endoftext|begin_of_text|eot_id|start_header_id|end_header_id)\w*\|>|<start_of_turn>|<end_of_turn>|<eos>|<\/s>/g;

      const isThinkingPrefilled = modelConfig.supportsThinking && options?.isThinkingEnabled !== false;
      if (isThinkingPrefilled && onStream) {
        streamBuffer = '<think>\n';
        onStream('<think>\n');
      }

      let callback_function: any = undefined;
      if (onStream && generator?.tokenizer) {
        callback_function = (beams: any[]) => {
          if (this.abortCurrentGeneration || streamAborted) {
            throw new Error('ABORT_GENERATION');
          }
          try {
            const bestBeam = beams[0];
            if (!bestBeam?.output_token_ids) return;
            const tokenIds = bestBeam.output_token_ids;

            if (startTokenIdx === -1) {
              startTokenIdx = Math.max(0, tokenIds.length - 1);
            }

            if (tokenIds.length > startTokenIdx) {
              const generatedTokens = tokenIds.slice(startTokenIdx);
              // Decode cumulative tokens so multi-byte UTF-8 sequences (like emojis) are fully assembled
              let fullDecoded = generator.tokenizer.decode(generatedTokens, { skip_special_tokens: false });

              if (!fullDecoded) return;

              // If fullDecoded ends with a Unicode replacement character, an emoji/multi-byte
              // character sequence is incomplete. Wait for the next token to complete it.
              if (fullDecoded.endsWith('\uFFFD')) {
                return;
              }

              // Strip framing chat tokens while preserving <think> / </think>
              fullDecoded = fullDecoded.replace(CHAT_TOKEN_RE, '');

              if (fullDecoded.length > lastEmittedLength) {
                const chunk = fullDecoded.slice(lastEmittedLength);
                lastEmittedLength = fullDecoded.length;

                // Detect if the model started a fake second user turn or meta commentary — stop streaming
                const fakeUserMarkers = [
                  '<|im_start|>user', '<|start_header_id|>user', '<start_of_turn>user',
                  '[End]', '[end]', '[END]', '[This was', '[Note:', '(Note:', '(This is', '(This was',
                ];
                let cutIdx = -1;
                for (const m of fakeUserMarkers) {
                  const i = (streamBuffer + chunk).indexOf(m);
                  if (i !== -1) {
                    cutIdx = i - streamBuffer.length;
                    break;
                  }
                }

                if (cutIdx !== -1) {
                  // Emit only the valid portion before the fake turn
                  const validChunk = chunk.slice(0, Math.max(0, cutIdx));
                  if (validChunk) onStream(validChunk);
                  streamAborted = true;
                  throw new Error('ABORT_GENERATION');
                }

                streamBuffer += chunk;
                if (chunk && onStream) {
                  onStream(chunk);
                }
              }
            }
          } catch (e: any) {
            if (e?.message === 'ABORT_GENERATION') throw e;
            // Non-fatal stream decode error
          }
        };
      }

      const output = await generator(formattedPrompt, { 
        max_new_tokens: maxTokens,
        temperature: 0.6,
        do_sample: true,
        top_p: 0.9,
        top_k: 50,
        repetition_penalty: 1.1,
        return_full_text: false,
        callback_function
      });

      let response = output[0]?.generated_text?.trim() || '';
      response = this.extractOutput(modelConfig, response, formattedPrompt, options);

      if (!response) {
        response = 'No response generated by the model.';
      }
      return response;
    } catch (error: any) {
      if (error.message === 'ABORT_GENERATION') {
        if (streamAborted && streamBuffer) {
          return this.extractOutput(modelConfig, streamBuffer, formattedPrompt);
        }
        throw new Error('Generation stopped by user.');
      }
      console.error('AI Generate Prompt Error:', error);
      throw new Error(error.message || 'Failed to generate response.');
    }
  }

  public async detectAi(sentences: string[], modelId?: string): Promise<{ scores: number[]; modelName: string } | null> {
    if (!sentences || sentences.length === 0) return { scores: [], modelName: '' };

    let targetModelId = modelId;
    if (!targetModelId) {
      const settings = this.storage.getSettings();
      targetModelId = settings.activeDetectorModelId;
    }

    if (!targetModelId) {
      const detectorModels = AVAILABLE_MODELS.filter(m => m.category === 'detector');
      for (const m of detectorModels) {
        if (this.modelManager.isDownloaded(m.id)) {
          targetModelId = m.id;
          break;
        }
      }
    }

    if (!targetModelId || !this.modelManager.isDownloaded(targetModelId)) {
      return null;
    }

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === targetModelId);
    if (!modelConfig) return null;

    try {
      const classifier = await this.getPipeline(modelConfig);
      const scores: number[] = [];

      for (const sentence of sentences) {
        if (!sentence.trim()) {
          scores.push(0);
          continue;
        }
        try {
          const res = await classifier(sentence);
          let aiProb = 0.5;
          if (Array.isArray(res) && res.length > 0) {
            const aiHit = res.find((item: any) => {
              const lbl = (item.label || '').toLowerCase();
              return lbl === 'fake' || lbl === 'label_1' || lbl === 'ai' || lbl === 'generated' || lbl === 'machine' || lbl === 'synthetic';
            });
            const humanHit = res.find((item: any) => {
              const lbl = (item.label || '').toLowerCase();
              return lbl === 'real' || lbl === 'label_0' || lbl === 'human' || lbl === 'original';
            });

            if (aiHit) {
              aiProb = aiHit.score;
            } else if (humanHit) {
              aiProb = 1 - humanHit.score;
            } else {
              const top = res[0];
              const labelLower = (top.label || '').toLowerCase();
              if (labelLower === 'fake' || labelLower === 'label_1' || labelLower === 'ai' || labelLower === 'generated') {
                aiProb = top.score;
              } else if (labelLower === 'real' || labelLower === 'label_0' || labelLower === 'human') {
                aiProb = 1 - top.score;
              } else {
                aiProb = top.score;
              }
            }
          }
          scores.push(Math.max(0, Math.min(100, Math.round(aiProb * 100))));
        } catch (err) {
          scores.push(50);
        }
      }

      return { scores, modelName: modelConfig.name };
    } catch (e) {
      console.error('AI Detect Error:', e);
      return null;
    }
  }

  public async translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'es',
    modelId: string = 'nllb-200-distilled-600m'
  ): Promise<{ translation: string; sourceLang: string; targetLang: string; modelName: string }> {
    if (!text || !text.trim()) {
      return { translation: '', sourceLang, targetLang, modelName: 'Meta NLLB-200' };
    }

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === modelId && m.category === 'translation')
      || AVAILABLE_MODELS.find(m => m.id === 'nllb-200-distilled-600m')
      || AVAILABLE_MODELS.find(m => m.category === 'translation');

    if (!modelConfig) {
      throw new Error(`Translation model '${modelId}' not found.`);
    }

    const isDownloaded = await this.modelManager.isDownloaded(modelConfig.id);
    if (!isDownloaded) {
      throw new Error(`Translation model '${modelConfig.name}' is not downloaded. Please download it from Settings or the Translation page.`);
    }

    // Resolve NLLB codes
    const srcCode = NLLB_LANGUAGE_MAP[sourceLang.toLowerCase()]?.code || sourceLang;
    const tgtCode = NLLB_LANGUAGE_MAP[targetLang.toLowerCase()]?.code || targetLang;

    const translator = await this.getPipeline(modelConfig);

    // Split text by paragraphs/newlines so original structure is preserved
    const paragraphs = text.split('\n');
    const translatedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        translatedParagraphs.push('');
        continue;
      }

      // If paragraph is long, split by sentence boundaries
      const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [paragraph];
      const translatedSentences: string[] = [];

      for (const sentence of sentences) {
        if (!sentence.trim()) continue;
        const result = await translator(sentence.trim(), {
          src_lang: srcCode,
          tgt_lang: tgtCode
        });

        const outputText = Array.isArray(result) && result.length > 0
          ? result[0].translation_text || ''
          : (result?.translation_text || '');

        translatedSentences.push(outputText);
      }

      translatedParagraphs.push(translatedSentences.join(' '));
    }

    return {
      translation: translatedParagraphs.join('\n'),
      sourceLang,
      targetLang,
      modelName: modelConfig.name
    };
  }
}

export const NLLB_LANGUAGE_MAP: Record<string, { code: string; name: string; nativeName: string }> = {
  'en': { code: 'eng_Latn', name: 'English', nativeName: 'English' },
  'es': { code: 'spa_Latn', name: 'Spanish', nativeName: 'Español' },
  'fr': { code: 'fra_Latn', name: 'French', nativeName: 'Français' },
  'de': { code: 'deu_Latn', name: 'German', nativeName: 'Deutsch' },
  'hi': { code: 'hin_Deva', name: 'Hindi', nativeName: 'हिन्दी' },
  'zh': { code: 'zho_Hans', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  'zh-tw': { code: 'zho_Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  'ja': { code: 'jpn_Jpan', name: 'Japanese', nativeName: '日本語' },
  'ar': { code: 'arb_Arab', name: 'Arabic', nativeName: 'العربية' },
  'ru': { code: 'rus_Cyrl', name: 'Russian', nativeName: 'Русский' },
  'pt': { code: 'por_Latn', name: 'Portuguese', nativeName: 'Português' },
  'it': { code: 'ita_Latn', name: 'Italian', nativeName: 'Italiano' },
  'nl': { code: 'nld_Latn', name: 'Dutch', nativeName: 'Nederlands' },
  'ko': { code: 'kor_Hang', name: 'Korean', nativeName: '한국어' },
  'tr': { code: 'tur_Latn', name: 'Turkish', nativeName: 'Türkçe' },
  'pl': { code: 'pol_Latn', name: 'Polish', nativeName: 'Polski' },
  'uk': { code: 'ukr_Cyrl', name: 'Ukrainian', nativeName: 'Українська' },
  'vi': { code: 'vie_Latn', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  'id': { code: 'ind_Latn', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  'th': { code: 'tha_Thai', name: 'Thai', nativeName: 'ไทย' },
  'bn': { code: 'ben_Beng', name: 'Bengali', nativeName: 'বাংলা' },
  'ta': { code: 'tam_Taml', name: 'Tamil', nativeName: 'தமிழ்' },
  'te': { code: 'tel_Telu', name: 'Telugu', nativeName: 'తెలుగు' },
  'mr': { code: 'mar_Deva', name: 'Marathi', nativeName: 'मराठी' },
  'ur': { code: 'urd_Arab', name: 'Urdu', nativeName: 'اردو' },
  'fa': { code: 'pes_Arab', name: 'Persian', nativeName: 'فارسی' },
  'sv': { code: 'swe_Latn', name: 'Swedish', nativeName: 'Svenska' },
  'cs': { code: 'ces_Latn', name: 'Czech', nativeName: 'Čeština' },
  'ro': { code: 'ron_Latn', name: 'Romanian', nativeName: 'Română' },
  'el': { code: 'ell_Grek', name: 'Greek', nativeName: 'Ελληνικά' },
  'hu': { code: 'hun_Latn', name: 'Hungarian', nativeName: 'Magyar' },
  'da': { code: 'dan_Latn', name: 'Danish', nativeName: 'Dansk' },
  'fi': { code: 'fin_Latn', name: 'Finnish', nativeName: 'Suomi' },
  'no': { code: 'nob_Latn', name: 'Norwegian', nativeName: 'Norsk' },
  'he': { code: 'heb_Hebr', name: 'Hebrew', nativeName: 'עבריت' },
  'ms': { code: 'zsm_Latn', name: 'Malay', nativeName: 'Bahasa Melayu' },
  'fil': { code: 'tgl_Latn', name: 'Filipino / Tagalog', nativeName: 'Tagalog' },
  'sw': { code: 'swh_Latn', name: 'Swahili', nativeName: 'Kiswahili' }
};

