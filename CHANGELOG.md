# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-08-16

### Added
- **Official Brand Logo & Visual Assets**:
  - Integrated the official application brand icon across the application.
  - Added a glowing glassmorphism logo badge in the Sidebar header with interactive micro-animations.
  - Added brand logo integration to the Settings header banner and About page profile card.
  - Configured native window icon for Electron `BrowserWindow` and HTML favicon (`icon.png`).
- **Production Build & Packaging Automation**:
  - **Microsoft Store Identity**: Integrated full Store Product Identity in `package.json` (`Saayan.AIGrammerStudio`, Publisher `CN=37E2AF47-D2FC-489C-BDC1-02C989A7B989`, Display Name `Saayan`).
  - **Standalone Windows Installer Build (`build_exe.bat`)**: Automated compilation of TypeScript main process, Vite frontend bundle, and NSIS setup packaging (`.exe`).
  - **Microsoft Store Package Build (`build_msix.bat`)**: Automated generation of `.msix` / `.appx` store packages with configured manifest identity.
  - **Unified Release Script (`build_all.bat`)**: Single-command build to generate both `.exe` and `.msix` release artifacts into `dist/`.
- **Version Management & Dynamic Synchronization**:
  - Added `change_version.bat` and `scripts/set-version.js` to safely update application version numbers across `package.json`, `package-lock.json`, and installer manifests with semantic version validation.
  - Dynamically bound the About page version display to `package.json` to keep UI version indicators always synchronized with release binaries.

### Changed
- **Rebranding & App Identity**:
  - Standardized application naming to **AI Grammar Studio** across `package.json`, Electron window configuration, document titles, navigation tooltips, and the About page.
  - Updated project metadata and description to reflect private, offline-first intelligent writing capabilities.

### Fixed
- **Editor Sidebar Toggle Arrow Theme Sync**:
  - Synchronized the collapsible analysis sidebar toggle button (`.pro-sidebar-toggle`) with Light and Dark themes, eliminating dark-mode artifacts when operating in light mode.
- **Global Text Selection Behavior**:
  - Disabled unintentional UI text selection (`user-select: none`) across navigation chrome, headers, and buttons, while preserving full selection and copy functionality inside text inputs, textareas, and AI response areas.

## [0.8.0] - 2026-08-17

### Fixed
- **Model Inference Error**: Fixed a bug where T5-based grammar models failed to load due to the backend forcing unquantized ONNX file lookups. The engine now respects `_quantized` conventions for seq2seq models.
- **Duplicate AI Rewrite Suggestions**: Fixed a bug in the Editor where identical AI rewrites would appear twice (as a main card and a redundant suggestion list item).
- **Persistent Rewrite UI Ghosting**: Fixed an issue where the AI Rewrite Suggestion card would instantly reappear after applying the rewrite.
- **Settings Persistence Race Condition**: Fixed a bug where user preferences (models, themes) were not remembered upon app restart. The UI now synchronizes with local storage asynchronously.
- **Light Theme UI Artifacts**: Conducted a comprehensive audit and fixed hardcoded dark-mode styles affecting the Light Mode experience across model cards, buttons, disabled states, and the sidebar.
- **Generic Model Warning**: Removed hardcoded "Flan-T5" references from the missing model warning in the Editor. The generic missing model message now routes correctly to the Settings page.

## [0.7.0] - 2026-08-16

### Added
- **New Specialized Grammar & Text-Editing Models**:
  - **Gec-T5 Small (`JonaWhisper/jonawhisper-gec-t5-small-onnx`)**: Integrated lightweight 80M parameter grammar correction model with custom local ONNX file path mapping (`encoder_model_int8.onnx` -> `onnx/encoder_model_quantized.onnx`, `decoder_model_int8.onnx` -> `onnx/decoder_model_merged_quantized.onnx`).
  - **T5 Base (Grammar) (`onnx-community/t5-base-grammar-correction-ONNX`)**: Integrated the specialized 250M parameter grammar model, with automatic prompt engineering to prepend the model-required `grammar: ` task prefix.
  - **CoEdIT Large (`imrahamed/coedit-large-webgpu-onnx`)**: Added Grammarly's 783M parameter state-of-the-art text-editing model for professional grammar correction and style adjustments.
- **Persistent & Collapsible Analysis Sidebar**:
  - Converted the Editor's analysis results panel into a permanent sidebar with a floating arrow toggle button (`ChevronLeft` / `ChevronRight`) to expand or collapse anytime.
  - Configured the sidebar to automatically slide open whenever "Analyze Text" is clicked.
  - Added a dynamic spinning loader animation (`Loader2`) and pulsing status indicator (`"Analyzing your text..."`) while AI inference is running.
- **React Portal Custom Selects**:
  - Upgraded `CustomSelect` dropdowns to render via `createPortal` directly to `document.body` with fixed viewport positioning, completely eliminating dropdown clipping caused by CSS `backdrop-filter` stacking contexts.
- **Unified Dark Obsidian & Indigo Theme**:
  - Standardized the dark mode color scheme (`#070a13` background, `#0f172a` surfaces, `#6366f1` indigo accents) across all application tabs (Editor, Creative Studio, Deep Analysis, Settings, About).
  - Synchronized left navigation bar styles with glowing active states and a branded logo box.
  - Redesigned the About tab with glassmorphism card styling, feature badges, and privacy highlights.

### Changed
- **Streamlined Model Catalog**:
  - Removed redundant parameter counts and `"Instruct"` / `"IT"` suffixes from model display names for clean readability.
  - Sorted all Grammar (80M → 250M → 783M) and Creative (0.6B → 1.0B → 1.2B → 1.5B → 1.7B) models strictly by parameter size.
- **Clean Typography-First Settings UI**:
  - Streamlined Settings headers, tab navigation, and section cards with distraction-free, clean typography.

### Removed
- **AI Tone Selectors**: Removed the legacy AI Tone dropdowns from both Editor and Settings pages for a simplified, focused workflow.
- **Legacy Models**: Removed `Qwen 2.5 0.5B` and `Flan-T5 Small` from available model configurations.
- **Emoji Clutter**: Removed all emojis and decorative vector art from Settings headers and tab navigation.

### Fixed
- **Model Verification & Download State**: Fixed an issue where models missing optional remote Hugging Face config files (`generation_config.json`) were never marked as downloaded, preventing download completion loops.
- **Dropdown Card Clipping**: Fixed settings cards clipping overflowing custom select menus on hover.

## [0.6.0] - 2026-08-12

### Added
- **Glassmorphic Pro Studio UI Redesign**:
  - Completely overhauled **Creative Studio**, **Grammar Studio (Editor)**, and **Deep Analysis** pages with a modern glassmorphism design system featuring dynamic radial glow gradients, subtle translucent cards (`backdrop-filter`), and floating action bars.
  - Added micro-animations for suggestion card entry, mode toggles, and results rendering.
- **Custom React Select UI**: Replaced native browser `<select>` dropdowns across the Settings page with custom-built glassmorphic `CustomSelect` components featuring smooth fade-in dropdown panels, custom hover glows, and `white-space: nowrap` text truncation.

### Fixed
- **Voice & Narration Engine Echo Bug**: Resolved an issue where small local LLMs echoed prompt instructions (e.g. `"Change active voice to passive voice."`) overwriting valid offline rule engine transformations like `"Shut the door" → "Let the door be shut."`. Added strict validation and prioritized offline rule engine outputs when available.
- **Empty Suggestion Cards in Editor**: Fixed missing issue messages in the Editor sidebar by fallback-binding `explanation` text and displaying exact trigger word highlights (e.g. `"things"`).
- **Comprehensive Light Mode Overrides**:
  - Fixed hardcoded dark backgrounds (`rgba(15, 23, 42)`) across all tabs (Creative, Editor, Analysis, Settings).
  - Fixed vanished text in Creative Studio title, empty states, input command bars, and dictionary vocabulary fields when operating under Light Theme.
  - Inverted hardware acceleration cards and model status tags seamlessly for bright environments.
- **UI Overflow & Hover Clipping**:
  - Eliminated annoying horizontal scrollbars that appeared when hovering over sidebar action buttons in Deep Analysis (**Tense**, **Voice**, **Narration**, **Clauses**).
  - Fixed z-index stacking context collisions in Settings field grids to ensure dropdown menus open smoothly over lower content cards without clipping.

## [0.5.0] - 2026-08-10

### Added
- **Advanced Offline Grammar Rules**: Vastly expanded the `QuickGrammarEngine` to detect advanced contextual issues offline:
  - **Double Negatives & Comma Splices**: Catches "didn't see nobody" and run-on sentences.
  - **Subject-Verb Agreement & Tense Alignment**: Fixes "the manager go", "lights wasn't", and backshift inconsistencies.
  - **Prepositions & Modifiers**: Corrects wrong prepositions ("responsible to" -> "responsible for") and dangling modifiers.
  - **Homophones & Plurals**: Fixes "Their are", uncountable noun mistakes ("datas"), and contraction mix-ups ("its" vs "it's").

### Fixed
- **AI Model Download Verifier**: `ModelManager.ts` now strictly requires both the ONNX weights folder AND configuration files (`tokenizer.json`, `config.json`) to mark a model as fully downloaded, preventing critical app crashes from dropped connections.
- **AI Prompt Format Crash**: Fixed an issue where Qwen and TinyLlama models would generate empty responses. The AI Engine now dynamically applies correct, model-specific ChatML tags (`<|im_start|>user`, `<|system|>`) and properly slices output (`return_full_text: false`) so instruction-tuned models correctly recognize prompts.
- **Model Compatibility Cleanup**: Removed unstable and PyTorch-only models (Vennify, CoEdIT) from the app. Settings now exclusively provides 100% verified Transformers.js ONNX models, including Flan-T5 models for Grammar, and Qwen / TinyLlama for Creative Writing.

## [0.4.1] - 2026-08-10

### Fixed
- **Narration Engine — Exclamatory Sentences**: `"What a/an ..."` and `"How ..."` exclamations now correctly transform to assertive indirect speech (e.g., `"What a magnificent view!"` → `"exclaimed with joy that it was a very magnificent view"`). Previously the engine used a generic `"exclaimed"` verb and did not convert the sentence structure.
- **Narration Engine — Let's/Let us Suggestions**: Reporting verb changed from `"proposed"` to `"suggested"` (the grammatically standard form). Tense backshift is now correctly applied inside the suggestion clause (e.g., `"are out"` → `"were out"`).
- **Narration Engine — Past Continuous Backshift**: `"was/were + V-ing"` is now correctly upgraded to `"had been + V-ing"` (past perfect continuous) in reported speech before other modal shifts run.
- **Narration Engine — Couldn't/Could Not**: `"couldn't"` and `"could not"` in direct speech now correctly become `"hadn't been able to"` / `"had not been able to"` in indirect speech, matching standard grammar rules.
- **Narration Engine — Embedded Clause Verbs**: Present-tense verbs inside sub-clauses introduced by wh-words (`how`, `what`, `where`, `when`, `whether`, `which`) are now backshifted even when the main clause already had a modal shift (e.g., `"how long it takes"` → `"how long it took"`).
- **Narration Engine — Multi-Word Listener Resolution**: Entity context for multi-word listeners (e.g., `"his mother"`) now correctly identifies gender by skipping possessive determiners and checking the head noun, preventing `"you → him"` errors when the listener is feminine.
- **Narration Engine — Smart Quote Normalisation**: Curly/smart quotes (`"`, `"`, `'`, `'`) are now normalised to straight quotes before parsing, fixing `"Let's"` and similar apostrophe-prefixed patterns.
- **Narration Engine — Type 2 Conditional Detection**: `"If ... had ... would"` patterns are now correctly identified as unreal-present conditionals and their tenses are preserved without further backshifting.
- **Narration Engine — Conjunction Comma Cleanup**: Commas carried over from quoted clauses before `"but"`, `"and"`, `"or"` are stripped in the indirect speech output (e.g., `"policy, but"` → `"policy but"`).

## [0.4.0] - 2026-08-09


### Added
- **Multi-Model Offline AI Manager**: Added support for 3 offline local AI models in Settings:
  - **Flan-T5 Base (450 MB)**: Ultra-fast, basic grammar checks.
  - **Qwen 1.5 0.5B (350 MB)**: Modern, lightweight conversational LLM for balanced speed and prompt comprehension.
  - **Phi-3 Mini 4K Instruct (2.2 GB)**: Microsoft's heavyweight local model for deep syntactic reasoning, voice transformations, and clause restructuring.
- **Dynamic AI Model Switching**: Users can download, inspect, delete, and switch active local AI models in Settings.
- **AI Prompt Studio Page**: Added a dedicated page for executing custom prompts, summaries, rephrasing, translations, and Q&A powered by local offline models.
- **Sentence-Level Paragraph Processing**: Updated the AI engine to split long text into sentence chunks before sending them to the model, preventing token truncation and fixing missing paragraph rewrites.

### Changed
- **Adaptive Prompt Templates**: Dynamic prompt formatting that automatically tailors instruction wrappers depending on model architecture (`text2text-generation` vs `text-generation`).

### Fixed
- **Conditional Apply Rewrite Button**: Hidden the "Apply Rewrite" button when text is already grammatically correct or no changes are generated.
- **Cross-Page Active Model Status**: Wired `activeModelId` through IPC to Editor, Prompt Studio, and Analysis pages so UI indicators accurately reflect active model status.
- **AI Analysis Verification**: Added case-and-punctuation-insensitive comparisons on AI outputs to ignore un-transformed responses and fall back to rules cleanly.
- **Editor Component Stability**: Fixed missing React `useEffect` import in `EditorPage.tsx` preventing runtime rendering crashes.

## [0.3.0] - 2026-08-08

### Added
- **Local AI Engine & Model Manager**: Integrated `@xenova/transformers` with `flan-t5-base` for 100% offline AI-powered deep text rewrites, tone adjustments (`professional`, `friendly`, `concise`), and real-time model download/deletion management in Settings.
- **Linguistic Analysis & Transformations Suite**:
  - **Voice Transformation**: AI-driven conversion between Active and Passive voice.
  - **Narration Transformation**: AI-driven conversion between Direct and Indirect speech.
  - **Parts of Speech (POS) Visualizer**: Interactive color-coded breakdown of Nouns, Verbs, Adjectives, Adverbs, Pronouns, and Prepositions using NLP, including flowing word cards and summary counts.
  - **Tense Structure Breakdown**: Automatic detection of verb phrases and sentence types (Positive, Negative, Interrogative) with formulaic representations across all English tenses.
- **Enhanced Style & Tone Rules**:
  - **Wordiness & Conciseness**: Detects verbose phrasing (e.g., "due to the fact that" → "because") and suggests concise replacements.
  - **Confusion Pairs**: Catches common misused pairs (e.g., "better then" → "better than").
  - **Informal Business Tone**: Identifies casual slang in formal contexts (e.g., "hit me up" → "contact me").
  - **Phrasal Verb Conversion**: Suggests formal single-word alternatives for informal phrasal verbs (e.g., "call off" → "cancel").
  - **Quote Capitalization**: Enforces proper capitalization for direct speech quotes (e.g., `He said, "hello"` → `He said, "Hello"`).
- **Readability & Text Metrics**: Added Flesch-Kincaid readability scoring, estimated reading time, and word/sentence counters.
- **Expanded Homophone Matching**: Added context rules for common homophone pairs including `there/their`, `to/too`, `affect/effect`, and `see/sea`.

### Changed
- **Editor AI Mode Integration**: Enhanced the Editor toolbar with tone selection for AI rewrites and live preview cards.

## [0.2.0] - 2026-08-08

### Added
- **Custom Dictionary Management**: Added the ability to save custom words directly from the editor using the new "Add to Dictionary" button on spelling error cards. These words are permanently ignored in future sessions.
- **Dictionary Manager in Settings**: Added a new UI section in the Settings page to view and remove custom words from your persistent dictionary.
- **Context-Aware Grammar Engine**: Added predictive rule systems (similar to mobile keyboards) that assess surrounding text to provide context-aware corrections (e.g., homophone matching like "their" vs "there").
- **Smart Punctuation Prediction**: Added intelligent terminal punctuation detection that accurately suggests question marks (`?`) for sentences starting with question words (e.g., "are", "what", "is"), rather than defaulting to periods (`.`).
- **Massive Professional Dictionary**: Expanded the offline dictionary with over 100+ professional, modern technology, and web terminology words to prevent common jargon from being falsely flagged.

### Fixed
- **Sequential Correction Syncing Bug**: Fixed a critical text-jumbling issue where applying one correction would invalidate the coordinates of remaining suggestions. The UI now dynamically recalculates and shifts the offsets of all remaining suggestions in real-time.
- **Stale Context Bug**: Implemented a seamless background re-check mechanism. When a correction is applied (e.g., `r` -> `are`), the engine instantly and silently re-evaluates the sentence in the background to dynamically update subsequent context-aware rules (like switching a period suggestion to a question mark).
- **Homophone Regex State Leak**: Fixed a bug in the QuickGrammarEngine where stateful `/g` Regex objects failed to reset their `lastIndex`, causing incorrect pattern matching on subsequent checks.
