
## Technical Design Document — AI Interaction Orchestrator (TDD)

Target implementer: Claude Sonnet 4
Stack: TypeScript (VS Code Extension API), small JS libs (tokenizer), optional Node worker (internal), in-memory stores.
Goals: modular, in-memory rules, efficient token usage, non-blocking chunk orchestration, runtime rule hot-swap.

⸻

Table of contents
	1.	High-level architecture
	2.	Module breakdown & responsibilities
	3.	Type definitions & interfaces (TypeScript)
	4.	Internal data flow & sequence diagrams (Mermaid)
	5.	Core algorithms
	•	Context Slimming (AST + heuristics)
	•	Prompt Compression
	•	Token Estimation
	•	Intelligent Chunking & Async Orchestration
	•	Response Summarization & Reassembly
	•	Cache of Successful Completions
	6.	Runtime behaviors
	•	Rule Hot-Swap
	•	Model Auto-Detect & Model Profiles (in-memory)
	•	Web Knowledge Sync (fetch into memory)
	•	Self-Evolving Ruleset (learning loop)
	7.	Error handling & fallbacks
	8.	Testing and validation plan
	9.	Observability, metrics and performance targets
	10.	Security & privacy considerations
	11.	Implementation checklist & sprint plan

⸻

1. High-level architecture (recap)

Components (in-extension / in-memory):
	•	PromptIntercept — intercepts user prompt
	•	EnhancerCore — performs slimming, compression, variants
	•	TokenOptimizer — token count & efficiency scoring
	•	ChunkOrchestrator — splits prompt, manages async calls
	•	ModelAdapter — detects model and routes requests
	•	ResponseSummarizer — summarizes & reassembles
	•	CacheManager — caches successful completions (RAM)
	•	RuleManager — in-memory rule registry + hot-swap
	•	WebSyncAgent — periodic remote fetch of best-practices into memory
	•	FeedbackLearner — updates weights/self-evolves rules
	•	UI — Prompt Preview WebView, Status Bar, Dashboard

All state is kept in memory (TypeScript objects, optionally VS Code Memento/localStorage for ephemeral persistence). No file-based JSON/YAML required.

⸻

2. Module breakdown & responsibilities

2.1 PromptIntercept
	•	Hook into editor/Chat input events.
	•	Provide last prompt, selection, file context, user id, active model id (if available).
	•	Pass to EnhancerCore.

2.2 EnhancerCore
	•	Context Slimming (AST & heuristics).
	•	Smart rewriting / compression (rule-based + lightweight transform).
	•	Produce 2–3 enhanced variants and metadata for TokenOptimizer.

2.3 TokenOptimizer
	•	Estimate tokens for each variant.
	•	Score variants (quality_predicted / tokens).
	•	Suggest best candidate(s).

2.4 ChunkOrchestrator
	•	For large prompts, split into chunks respecting token budgets and model sweet spots.
	•	Manage asynchronous interactions:
	•	Submit chunk → receive partial response → summarize or store → submit next chunk with summarized context.
	•	Provide progress reporting to UI and allow user interruption.

2.5 ModelAdapter
	•	Detect active IDE (VS Code/Cursor/Windsurf) via environment inspection.
	•	Within each IDE, detect available LLM providers and active models.
	•	Support multiple concurrent LLM providers per IDE.
	•	Provide unified API abstraction for different provider endpoints:
		- GitHub Copilot Chat API (in VS Code)
		- Cursor's internal LLM API
		- Windsurf's AI integration
		- Direct API calls (OpenAI, Anthropic, etc.)
	•	Handle provider-specific authentication and request formatting.
	•	Provide per-model params (temperature, max tokens, sweet spot) from in-memory registry.

2.6 ResponseSummarizer
	•	Condense model outputs into a short summary to present to user.
	•	Handle multi-chunk responses and reassembly.

2.7 CacheManager
	•	Short-term in-RAM cache keyed by prompt-hash + normalized-prompt signature.
	•	Serve cached completions when similarity passes threshold.

2.8 RuleManager
	•	Holds rules & weights in memory.
	•	Hot-swap capability (reload functions/objects at runtime).
	•	Expose APIs to update rules from WebSyncAgent or FeedbackLearner.

2.9 WebSyncAgent
	•	Periodically fetch curated rules/best-practices (single small JSON endpoint or gist).
	•	Merge into RuleManager in-memory (no files).

2.10 FeedbackLearner
	•	Track implicit feedback (accept/edit/discard).
	•	Update in-memory weights for heuristics & compression aggressiveness.

⸻

3. Type definitions & interfaces (TypeScript)

// modelProfiles.ts (in-memory)
export type IDEType = 'vscode' | 'cursor' | 'windsurf';
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'github-copilot' | 'cursor-ai' | 'cohere' | 'mistral' | string;
export type ModelId = string; // e.g., 'gpt-4', 'claude-3-5-sonnet', 'gemini-2.5-flash', 'cursor-small'

export interface RuntimeEnvironment {
  ide: IDEType;
  availableProviders: LLMProvider[];
  activeProvider?: LLMProvider;
  activeModel?: ModelId;
}

export interface ModelProfile {
  id: ModelId;
  provider: LLMProvider;
  name: string;
  sweetSpotTokens: number; // ideal prompt token count
  maxTokens: number;
  preferredStyle: 'imperative'|'contextual'|'descriptive'|'intent';
  notes?: string[];
  defaultParams?: {
    temperature?: number;
    top_p?: number;
    // more model-specific params
  }
}

// prompt
export interface PromptContext {
  originalPrompt: string;
  filePath?: string; // active file
  selection?: string;
  editorSnapshot?: string; // small context lines
  userId?: string;
  modelHint?: ModelId | null;
}

// enhancer outputs
export interface EnhancedPrompt {
  id: string; // uuid
  text: string;
  variants?: string[]; // if enhancer returns variants
  meta?: Record<string, any>; // e.g. compression ratio
  estimatedTokens?: number;
  score?: number; // efficiency score
}

// chunk orchestration
export interface Chunk {
  id: string;
  index: number;
  text: string;
  tokenCount: number;
  context?: string; // short summary of prior chunks
}
export interface ChunkResult {
  chunkId: string;
  response: string;
  summary?: string;
  tokenUsed: number;
}

// cache
export interface CacheEntry {
  promptHash: string;
  normalizedPrompt: string;
  response: string;
  embedding?: number[]; // optional
  timestamp: number;
}

// rule manager
export type Rule = (prompt: PromptContext, state: any) => Promise<PromptTransform>;

export interface PromptTransform {
  transformed: string;
  reason?: string;
  meta?: any;
}


⸻

4. Internal data flow & sequence diagrams

4.1 High-level flow (Mermaid)

sequenceDiagram
  participant User
  participant VS as VSCode
  participant PI as PromptIntercept
  participant EC as EnhancerCore
  participant TO as TokenOptimizer
  participant CO as ChunkOrchestrator
  participant MA as ModelAdapter
  participant RS as ResponseSummarizer
  participant Cache as CacheManager
  participant UI as UI (WebView/Status)

  User->>VS: types prompt
  VS->>PI: onPrompt()
  PI->>Cache: check(prompt)
  Cache-->>PI: cache? (yes/no)
  alt cache hit
    PI->>UI: show cached response
  else cache miss
    PI->>EC: slim & enhance
    EC->>TO: estimate tokens & score
    TO-->>UI: show preview + token counts
    UI->>PI: user approves variant
    PI->>CO: submit variant
    CO->>MA: send chunk(s)
    MA->>CO: partial responses
    CO->>RS: summarize & reassemble
    RS->>Cache: store(response)
    RS->>UI: show final summary
  end

4.2 Chunk orchestration with async partials (Mermaid)

sequenceDiagram
  participant CO as ChunkOrchestrator
  participant MA as ModelAdapter
  participant RS as ResponseSummarizer
  participant UI as UI

  CO->>MA: send chunk #0
  MA-->>CO: response #0 (partial)
  CO->>RS: summarize response #0
  RS-->>CO: summary #0
  CO->>UI: show progress (summary #0)
  CO->>MA: send chunk #1 with context(summary #0)
  MA-->>CO: response #1
  CO->>RS: merge & summarize (#0 + #1)
  RS-->>UI: final consolidated summary


⸻

5. Core algorithms

5.1 Context Slimming (AST + heuristics)

Goal: remove token-irrelevant context while preserving semantics.

Steps:
	1.	Extract editorSnapshot lines (e.g., 200–400 chars around cursor).
	2.	Parse file type (by extension). If code, use a lightweight parser:
	•	For JS/TS: use @babel/parser or typescript compiler API (light usage).
	•	For Python: simple regex heuristics.
	3.	Heuristics:
	•	Remove comments (unless TODO or docstring referred by prompt).
	•	Keep function/class signatures containing the cursor name or selected identifiers.
	•	Remove long import blocks (keep only those referenced locally).
	•	Keep only top N (configurable) lines of file context prioritized by relevance score (identifier overlap with prompt).
	4.	Output slimContext string.

Pseudo-code:

function slimContext(prompt: PromptContext): string {
  const snapshot = prompt.editorSnapshot || '';
  const tokens = tokenize(snapshot);
  // 1. basic trimming
  let trimmed = removeComments(snapshot);
  // 2. compute relevance for each line
  const lines = trimmed.split('\n');
  const scored = lines.map(l => ({ line: l, score: relevance(l, prompt.originalPrompt) }));
  const topLines = scored.sort(byScoreDesc).slice(0, TOP_N).map(x=>x.line);
  return topLines.join('\n');
}

relevance(line, prompt) uses TF-IDF-lite or simple token intersection.

⸻

5.2 Prompt Compression (Rule-based + micro-ML)

Principles:
	•	Preserve nouns, function names, required types, CLI flags, file references.
	•	Replace verbose phrases with concise forms.
	•	Remove filler words and polite prefixes.

Examples:
	•	"Can you please generate" → "Generate"
	•	"I want a function that takes a list and returns" → "Function(list) -> returns"

Pseudo-code:

const compressionRules: Array<{pattern: RegExp, replace: string}> = [
  [/can you please/gi, ''],
  [/please/gi, ''],
  [/I want (a|an)/gi, ''],
  [/\bthat will\b/gi, ''],
  // ... more rules
];

function compressPrompt(text: string): string {
  let res = text;
  for (const r of compressionRules) res = res.replace(r.pattern, r.replace);
  res = normalizeWhitespace(res);
  // preserve code blocks
  return res;
}

Optionally apply a micro summarizer (small LLM or heuristic) to compress where rules insufficient.

⸻

5.3 Token Estimation
	•	Use a JS tokenizer implementation: gpt-tokenizer, gpt-3-encoder, or @dqbd/tiktoken-like (if native bindings allowed).
	•	Estimate tokens for prompt + slimContext.
	•	Provide estimatedTokens on each candidate.

API:

function estimateTokens(text: string): number {
  return tokenizer.encode(text).length;
}


⸻

5.4 Intelligent Chunking & Async Orchestration (detailed)

Goals:
	•	If estimatedTokens > modelProfile.maxTokens * 0.6 or > sweetSpot threshold, chunk.
	•	Maintain user-facing non-blocking UX.
	•	For each chunk:
	•	Submit chunk sequentially or in limited parallel (prefer sequential with summarized context).
	•	Receive partial response and summarize it.
	•	Use summarized output as context for next chunk.
	•	If model supports streaming, use streaming to get partial outputs faster.

Chunking strategy:
	•	Split prompt into semantic sections:
	•	Use natural paragraph boundaries, code block boundaries, or sentence split.
	•	Ensure each chunk token count ≤ chunkTokenLimit, where:
chunkTokenLimit = min(modelProfile.sweetSpotTokens, modelProfile.maxTokens * 0.5)

Chunk Orchestration Modes:
	•	Sequential (default): chunk0 → get response0 → summarize → chunk1 (with summary0) → …
	•	Parallel (optional): send chunks concurrently and then merge; higher model cost & complexity — avoid unless model+latency justify.

Pseudo-code (sequential):

async function orchestrateChunks(chunks: Chunk[], model: ModelProfile, onProgress: (p)=>void) {
  let aggregatedSummary = '';
  const results: ChunkResult[] = [];

  for (let i=0; i<chunks.length; i++) {
    const chunk = chunks[i];
    const payload = buildPayload(chunk.text, aggregatedSummary, model);
    const response = await ModelAdapter.call(payload); // asynchronous call
    const summary = await ResponseSummarizer.summarize(response);
    results.push({chunkId: chunk.id, response, summary, tokenUsed: estimateTokens(response)});
    aggregatedSummary = mergeSummaries(aggregatedSummary, summary);
    onProgress({index:i, total:chunks.length, summary: aggregatedSummary});
    // allow early user interrupt: check UI or CancellationToken
    if (userCancelled()) break;
  }

  const final = mergeResults(results);
  return final;
}

Non-blocking UI behavior:
	•	After sending first chunk, UI shows Processing (1/3) & partial summary.
	•	User can continue editing; results will be posted to Chat/Editor when ready.
	•	Provide cancel button (sends cancellation token to orchestrator).

Chunk building example:
	•	For long prompt with code + explanation:
	•	Chunk 0: short summary + first code block
	•	Chunk 1: remaining code + tests
	•	Chunk 2: extra instructions (edge cases, performance)

Handling model turn limits:
	•	Each subsequent chunk includes only aggregated summary (not full prior text), drastically reducing token usage.

⸻

5.5 Response Summarization & Reassembly
	•	Use heuristics/small summarizer: extract key actions, outputs, code snippets, and a 2–4 line summary.
	•	For responses containing code, preserve code blocks and include code diffs when possible.
	•	When reassembling multiple chunk results:
	•	Merge summaries (concatenate and compress).
	•	Merge code outputs by ordering and de-duplicating.
	•	If conflict between chunk responses (contradiction), raise a small “clarify” prompt to model: feed conflicting fragments and ask for canonical merge.

Pseudo-code merge:

function mergeResults(results: ChunkResult[]): {finalResponse: string, finalSummary: string} {
  const summaries = results.map(r => r.summary).filter(Boolean);
  const codes = results.flatMap(r => extractCodeBlocks(r.response));
  const mergedCode = deduplicateAndMerge(codes);
  const finalSummary = compressSummary(summaries.join('\n'));
  const finalResponse = `${finalSummary}\n\n${mergedCode}`;
  return {finalResponse, finalSummary};
}


⸻

5.6 Cache Successful Completions
	•	Short-term RAM cache: LRU with TTL (e.g., 10–60 minutes).
	•	Key: normalized prompt hash (lowercase, whitespace normalized, compressed).
	•	Similarity check: cosine similarity via tiny embedding or token overlap; require threshold > 0.9 for exact reuse or ≥0.8 for suggested reuse (then verify with user).

API:

function getCached(prompt: string): string | null
function putCache(prompt: string, response: string): void


⸻

6. Runtime behaviors

6.1 Rule Hot-Swap
	•	Rules stored as in-memory TS functions/objects.
	•	Provide RuleManager.reload(rules: Rule[]) which replaces the active set.
	•	Watch WebSyncAgent results and call reload when new rulebundle arrives.
	•	Hot-swap must be atomic: prepare new set, then atomically swap pointers.

Implementation note: Use function factories to produce transforms, not eval. Example:

const ruleSet: Rule[] = [rule1, rule2];
function applyRules(prompt) {
  let p = prompt;
  for (const r of ruleSet) p = await r(p);
  return p;
}
// for hot-swap:
function swapRuleSet(newRules) { ruleSet = newRules; }

6.2 IDE & Model Auto-Detection Strategy (Multi-layered)

Detection layers:
1. **IDE Detection**:
	•	VS Code: Check `vscode` module availability + process.env.VSCODE_*
	•	Cursor: Check for Cursor-specific APIs and process signatures
	•	Windsurf: Check for Windsurf-specific environment variables

2. **Provider Detection** (per IDE):
	•	Scan for installed extensions (GitHub Copilot, Claude, etc.)
	•	Check available API endpoints and their capabilities
	•	Monitor active chat/completion sessions to identify current provider

3. **Model Detection**:
	•	Hook into provider-specific events when possible
	•	Parse API call metadata to identify model being used
	•	Fallback to user configuration or environment hints

**ModelManager** holds `Map<string, ModelProfile>` keyed by `${provider}:${modelId}`.
**WebSyncAgent** can update profiles for newly discovered models.

Example detection result:
```typescript
interface DetectionResult {
  ide: IDEType;
  providers: Array<{
    id: LLMProvider;
    models: ModelId[];
    isActive: boolean;
    apiEndpoint?: string;
  }>;
}
```

6.3 Web Knowledge Sync
	•	Periodic fetch (configurable interval) to a curated endpoint (single small JSON).
	•	Fetch merges into in-memory ModelProfile and RuleManager rules (only if signatures/versions differ).
	•	Minimal effect on extension size (single small fetch).

6.4 Self-Evolving Ruleset (learning loop)
	•	Trigger learning updates asynchronously after N interactions (e.g., 10).
	•	Evaluate rule performance: accepted / edit ratio, token savings, response quality proxy.
	•	Adjust weights (e.g., compression aggressiveness) by updating in-memory params.

Safety: learning only changes numeric weights and param values; structural rule changes require manual review or a higher trust score.

⸻

7. Error handling & fallbacks
	•	Model call failure: attempt retry (1-2 times). If streaming aborted, fall back to single-call mode.
	•	Chunk failure mid-stream: re-run orchestration from last successful summary; inform user.
	•	Hot-swap rule error: validate new rule functions before swapping; if invalid, reject and keep previous set.
	•	Cache miss / similarity near-threshold: prompt user: “A similar result exists in cache — use it?” (non-blocking).
	•	User cancels: send cancellation token to orchestration, ensure no dangling promises.

⸻

8. Testing and validation plan

Unit tests
	•	ContextSlimmer for many language snippets.
	•	Compressor rules correctness & idempotence.
	•	TokenEstimator accuracy vs token lib.

Integration tests
	•	Simulate long prompts → verify chunking & reassembly correctness.
	•	Simulate model latency → check UI non-blocking & cancellation.
	•	Hot-swap tests: apply new rulesets and validate atomic swap.

E2E tests
	•	Use dummy model adapter (stub) that returns predictable responses; test acceptance flow UI → enhancing → sending → summarization.

Performance tests
	•	Tokenization speed under 100 ms for 1000 tokens.
	•	Chunk orchestration round-trip for 3 chunks under 3 seconds (depending on model latency).

⸻

9. Observability, metrics and performance targets

Metrics to collect (opt-in & anonymized):
	•	Average token saved per prompt.
	•	Accept / edit / discard ratios.
	•	Average number of chunks per long prompt.
	•	Response latencies (per chunk & total).
	•	Rule application frequency & success.

Targets:
	•	Extension added latency < 250ms for enhancement + token estimation.
	•	Token savings average ≥ 30% for compressed prompts.
	•	UI responsiveness (status updates) < 100ms.

⸻

10. Security & privacy considerations
	•	Default: All data local, no cloud sync without explicit opt-in.
	•	If WebSyncAgent fetches remote rules, only fetch from curated endpoints (e.g., validated GitHub Gist). Verify HTTPS and expected JSON schema.
	•	Any telemetry must be opt-in, anonymized, and documented in README.
	•	No API keys stored in extension storage. If user integrates external LLM keys, those are managed by the external extension (not APO).

⸻

11. Implementation checklist & sprint plan

Sprint 0 — scaffolding (2–3 days)
	•	Create VS Code extension skeleton (TypeScript).
	•	Implement PromptIntercept, UI simple preview modal, status bar.

Sprint 1 — core enhancement & tokenization (4–6 days)
	•	Implement EnhancerCore (compression rules).
	•	Wire TokenOptimizer with tokenizer lib.
	•	Preview and Quick-Refine hotkey.

Sprint 2 — chunking & orchestration (5–7 days)
	•	Implement ChunkOrchestrator (sequential mode).
	•	Build ResponseSummarizer simple heuristics.
	•	Cache manager (in-RAM).

Sprint 3 — model integration & hot-swap (4–6 days)
	•	Implement ModelAdapter abstraction, in-memory ModelProfile registry.
	•	Build RuleManager with hot-swap API.

Sprint 4 — WebSync & self-evolving (3–5 days)
	•	Implement WebSyncAgent with safe merge.
	•	Implement FeedbackLearner with weight adjustments.

Sprint 5 — polishing & tests (4–6 days)
	•	Add unit/integration tests, E2E stubs.
	•	Performance tuning & UX polish.

⸻

Appendix — Code snippets & utilities

buildPayload helper (TypeScript pseudocode)

function buildPayload(chunkText: string, aggregatedSummary: string | null, model: ModelProfile) {
  const prompt = aggregatedSummary ? `${aggregatedSummary}\n\nNew chunk:\n${chunkText}` : chunkText;
  return {
    model: model.id,
    prompt,
    params: model.defaultParams
  };
}

cancellation pattern

const controller = new AbortController();
function userCancelled() { return controller.signal.aborted; }
function cancel() { controller.abort(); }

LRU cache simple (in memory)

class LRUCache {
  constructor(max = 200) { /* ... */ }
  get(key:string){ /* ... */ }
  set(key:string,value:any){ /* ... */ }
}


⸻

Final notes & recommendations
	•	Keep it small: avoid bundling heavy models. Use rule-based compressors + small tokenizer libs. If embedding any model (mini on-device), keep <50MB and optional.
	•	User control: always allow user to preview and cancel orchestration. Make automation the assistant, not an autopilot.
	•	Extensibility: design ModelAdapter and RuleManager as plugin points for new model integrations.
	•	Safety-first learning: metadata-only weight updates for self-evolution; avoid automatic structural rule rewrites without review.

⸻
