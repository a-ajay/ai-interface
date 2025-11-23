/**
 * Core type definitions for AI Interaction Orchestrator
 * Based on Technical Design Document specifications
 */
export type IDEType = 'vscode' | 'cursor' | 'windsurf';
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'github-copilot' | 'cursor-ai' | 'cohere' | 'mistral' | string;
export type ModelId = string;
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
    sweetSpotTokens: number;
    maxTokens: number;
    preferredStyle: 'imperative' | 'contextual' | 'descriptive' | 'intent';
    notes?: string[];
    defaultParams?: {
        temperature?: number;
        top_p?: number;
        max_tokens?: number;
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
export interface PromptContext {
    originalPrompt: string;
    filePath?: string;
    selection?: string;
    editorSnapshot?: string;
    userId?: string;
    modelHint?: ModelId | null;
    timestamp?: number;
}
export interface EnhancedPrompt {
    id: string;
    text: string;
    variants?: string[];
    meta?: Record<string, any>;
    estimatedTokens?: number;
    score?: number;
    compressionRatio?: number;
    transformations?: string[];
}
export interface PromptTransform {
    transformed: string;
    reason?: string;
    meta?: any;
}
export interface Chunk {
    id: string;
    index: number;
    text: string;
    tokenCount: number;
    context?: string;
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
export interface CacheEntry {
    promptHash: string;
    normalizedPrompt: string;
    response: string;
    embedding?: number[];
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
    acceptanceRate: number;
}
export interface OrchestratorConfig {
    enabled: boolean;
    compressionLevel: 'light' | 'moderate' | 'aggressive';
    tokenSavingsTarget: number;
    enableWebSync: boolean;
    cacheTimeout: number;
    chunkThreshold: number;
    maxConcurrentChunks: number;
}
export interface OrchestratorEvent {
    type: 'prompt-enhanced' | 'chunk-progress' | 'response-ready' | 'cache-hit' | 'error';
    data: any;
    timestamp: number;
}
export interface RemoteRuleBundle {
    version: string;
    rules: any[];
    modelProfiles: Record<string, ModelProfile>;
    compressionPatterns: CompressionPattern[];
    signature?: string;
}
export interface CompressionPattern {
    pattern: RegExp | string;
    replacement: string;
    description?: string;
    weight?: number;
}
export interface OrchestratorError {
    code: string;
    message: string;
    context?: any;
    timestamp: number;
}
export interface ExtensionState {
    config: OrchestratorConfig;
    runtimeEnv: RuntimeEnvironment;
    activeRules: RuleSet;
    metrics: Metrics;
    cache: Map<string, CacheEntry>;
    modelProfiles: Map<string, ModelProfile>;
}
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
export interface FeedbackSignal {
    promptId: string;
    action: 'accepted' | 'edited' | 'rejected' | 'cancelled';
    originalPrompt: string;
    enhancedPrompt: string;
    userEdit?: string;
    timestamp: number;
}
export interface LearningWeights {
    compressionAggressiveness: number;
    contextSlimmingThreshold: number;
    chunkingPreference: number;
    modelSpecificAdjustments: Record<ModelId, number>;
}
//# sourceMappingURL=types.d.ts.map