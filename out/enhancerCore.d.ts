/**
 * EnhancerCore Module
 * Performs context slimming, prompt compression, and enhancement
 */
import { PromptContext, EnhancedPrompt, CompressionPattern, OrchestratorConfig } from './types';
export declare class EnhancerCore {
    private compressionRules;
    private config;
    constructor(config: OrchestratorConfig);
    /**
     * Main enhancement method - produces enhanced prompt variants
     */
    enhance(context: PromptContext): Promise<EnhancedPrompt[]>;
    /**
     * Context Slimming - Remove unnecessary context while preserving semantics
     */
    private slimContext;
    /**
     * Remove comments unless they're relevant to the prompt
     */
    private removeComments;
    /**
     * Remove imports that aren't referenced in the prompt
     */
    private removeUnusedImports;
    /**
     * Extract imported names from an import statement
     */
    private extractImportedNames;
    /**
     * Calculate relevance score for a line of code
     */
    private calculateLineRelevance;
    /**
     * Simple tokenization for relevance calculation
     */
    private tokenize;
    /**
     * Prompt compression using rule-based patterns
     */
    private compressPrompt;
    /**
     * Initialize compression rules based on config
     */
    private initializeCompressionRules;
    /**
     * Create aggressive compression variant
     */
    private createAggressiveVariant;
    /**
     * Create minimal variant (extreme compression)
     */
    private createMinimalVariant;
    /**
     * Extract action from prompt
     */
    private extractAction;
    /**
     * Extract subject from prompt
     */
    private extractSubject;
    /**
     * Extract constraints from prompt
     */
    private extractConstraints;
    /**
     * Combine prompt with context
     */
    private combinePromptWithContext;
    /**
     * Calculate compression ratio
     */
    private calculateCompressionRatio;
    /**
     * Get maximum context lines based on config
     */
    private getMaxContextLines;
    /**
     * Update compression rules (for hot-swapping)
     */
    updateCompressionRules(newRules: CompressionPattern[]): void;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<OrchestratorConfig>): void;
}
//# sourceMappingURL=enhancerCore.d.ts.map