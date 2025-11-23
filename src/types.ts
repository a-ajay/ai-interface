/**
 * Core type definitions for AI Interaction Orchestrator
 * Based on Technical Design Document specifications
 */

// IDE and Model Detection Types
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
  preferredStyle: 'imperative' | 'contextual' | 'descriptive' | 'intent';
  notes?: string[];
  defaultParams?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    // more model-specific params
  };
}

export interface DetectionResult {
  ide: IDEType;
  providers: Array<{
    id: LLMProvider;
    models: ModelId[];
    isActive: boolean;
    apiEndpoint?: string;
  }>;
}

// Prompt Context and Enhancement Types
export interface PromptContext {
  originalPrompt: string;
  filePath?: string; // active file
  selection?: string;
  editorSnapshot?: string; // small context lines
  userId?: string;
  modelHint?: ModelId | null;
  timestamp?: number;
}

export interface EnhancedPrompt {
  id: string; // uuid
  text: string;
  variants?: string[]; // if enhancer returns variants
  meta?: Record<string, any>; // e.g. compression ratio
  estimatedTokens?: number;
  score?: number; // efficiency score
  compressionRatio?: number;
  transformations?: string[]; // list of applied transformations
}

export interface PromptTransform {
  transformed: string;
  reason?: string;
  meta?: any;
}

// Chunking and Orchestration Types
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

export interface ChunkProgress {
  index: number;
  total: number;
  summary: string;
}

// Cache Types
export interface CacheEntry {
  promptHash: string;
  normalizedPrompt: string;
  response: string;
  embedding?: number[]; // optional for similarity matching
  timestamp: number;
  metadata?: {
    model?: ModelId;
    tokensSaved?: number;
    compressionRatio?: number;
  };
}

export interface CacheOptions {
  maxEntries?: number;
  ttlMinutes?: number;
  similarityThreshold?: number;
}

// Rule Management Types
export type Rule = (prompt: PromptContext, state: any) => Promise<PromptTransform>;

export interface RuleSet {
  id: string;
  version: string;
  rules: Rule[];
  weights: Record<string, number>;
  metadata?: {
    description?: string;
    author?: string;
    lastUpdated?: number;
  };
}

// UI and Progress Types
export interface UIState {
  isProcessing: boolean;
  currentOperation?: string;
  progress?: ChunkProgress;
  metrics?: Metrics;
}

export interface Metrics {
  totalPrompts: number;
  totalTokensSaved: number;
  averageCompressionRatio: number;
  cacheHitRate: number;
  averageResponseTime: number;
  acceptanceRate: number; // % of enhanced prompts accepted by user
}

// Configuration Types
export interface OrchestratorConfig {
  enabled: boolean;
  compressionLevel: 'light' | 'moderate' | 'aggressive';
  tokenSavingsTarget: number; // percentage
  enableWebSync: boolean;
  cacheTimeout: number; // minutes
  chunkThreshold: number; // tokens
  maxConcurrentChunks: number;
}

// Event Types for Extension Communication
export interface OrchestratorEvent {
  type: 'prompt-enhanced' | 'chunk-progress' | 'response-ready' | 'cache-hit' | 'error';
  data: any;
  timestamp: number;
}

// WebSync Types
export interface RemoteRuleBundle {
  version: string;
  rules: any[]; // serialized rule functions
  modelProfiles: Record<string, ModelProfile>;
  compressionPatterns: CompressionPattern[];
  signature?: string; // for verification
}

export interface CompressionPattern {
  pattern: RegExp | string;
  replacement: string;
  description?: string;
  weight?: number;
}

// Error Types
export interface OrchestratorError {
  code: string;
  message: string;
  context?: any;
  timestamp: number;
}

// Extension State
export interface ExtensionState {
  config: OrchestratorConfig;
  runtimeEnv: RuntimeEnvironment;
  activeRules: RuleSet;
  metrics: Metrics;
  cache: Map<string, CacheEntry>;
  modelProfiles: Map<string, ModelProfile>;
}

// Model Adapter Types
export interface ModelRequest {
  prompt: string;
  model: ModelId;
  params?: Record<string, any>;
  context?: string;
}

export interface ModelResponse {
  text: string;
  tokenUsed: number;
  model: ModelId;
  metadata?: Record<string, any>;
}

// Feedback Learning Types
export interface FeedbackSignal {
  promptId: string;
  action: 'accepted' | 'edited' | 'rejected' | 'cancelled';
  originalPrompt: string;
  enhancedPrompt: string;
  userEdit?: string; // if user edited the enhanced prompt
  timestamp: number;
}

export interface LearningWeights {
  compressionAggressiveness: number;
  contextSlimmingThreshold: number;
  chunkingPreference: number;
  modelSpecificAdjustments: Record<ModelId, number>;
}