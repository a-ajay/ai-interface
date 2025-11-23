/**
 * TokenOptimizer Module
 * Estimates tokens and scores prompt variants for efficiency
 */
import { EnhancedPrompt, ModelProfile, OrchestratorConfig } from './types';
export declare class TokenOptimizer {
    private config;
    constructor(config: OrchestratorConfig);
    /**
     * Estimate token count for a given text using GPT tokenizer
     */
    estimateTokens(text: string): number;
    /**
     * Fallback token estimation method (rough approximation)
     */
    private fallbackTokenEstimate;
    /**
     * Score enhanced prompt variants based on efficiency and quality predictions
     */
    scoreVariants(variants: EnhancedPrompt[], modelProfile?: ModelProfile): EnhancedPrompt[];
    /**
     * Calculate efficiency score for a variant
     */
    private calculateEfficiencyScore;
    /**
     * Calculate model-specific scoring adjustments
     */
    private calculateModelSpecificScore;
    /**
     * Get style-specific scoring adjustments
     */
    private getStyleScore;
    /**
     * Predict quality score based on prompt characteristics
     */
    private predictQualityScore;
    /**
     * Check if prompt has clarity indicators
     */
    private hasClairityIndicators;
    /**
     * Check if prompt has specificity indicators
     */
    private hasSpecificityIndicators;
    /**
     * Check if prompt has good structure
     */
    private hasGoodStructure;
    /**
     * Determine if prompt needs chunking based on token count and model limits
     */
    needsChunking(tokenCount: number, modelProfile?: ModelProfile): boolean;
    /**
     * Suggest optimal chunk size for a model
     */
    getOptimalChunkSize(modelProfile?: ModelProfile): number;
    /**
     * Calculate token savings percentage
     */
    calculateTokenSavings(originalText: string, enhancedText: string): number;
    /**
     * Get token usage statistics
     */
    getTokenStats(variants: EnhancedPrompt[]): {
        min: number;
        max: number;
        average: number;
        bestScore: number;
        totalSavings: number;
    };
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<OrchestratorConfig>): void;
}
//# sourceMappingURL=tokenOptimizer.d.ts.map