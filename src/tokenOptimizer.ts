/**
 * TokenOptimizer Module
 * Estimates tokens and scores prompt variants for efficiency
 */

import { encode } from 'gpt-tokenizer';
import { EnhancedPrompt, ModelProfile, OrchestratorConfig } from './types';

export class TokenOptimizer {
  private config: OrchestratorConfig;
  
  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Estimate token count for a given text using GPT tokenizer
   */
  public estimateTokens(text: string): number {
    try {
      return encode(text).length;
    } catch (error) {
      // Fallback to simple estimation if tokenizer fails
      console.warn('Token estimation failed, using fallback:', error);
      return this.fallbackTokenEstimate(text);
    }
  }

  /**
   * Fallback token estimation method (rough approximation)
   */
  private fallbackTokenEstimate(text: string): number {
    // Rough approximation: ~4 characters per token on average
    const baseEstimate = Math.ceil(text.length / 4);
    
    // Adjust for code vs natural language
    const codeBlockCount = (text.match(/```/g) || []).length / 2;
    const hasCode = codeBlockCount > 0;
    
    // Code tends to have more tokens per character
    const adjustment = hasCode ? 1.3 : 1.0;
    
    return Math.ceil(baseEstimate * adjustment);
  }

  /**
   * Score enhanced prompt variants based on efficiency and quality predictions
   */
  public scoreVariants(variants: EnhancedPrompt[], modelProfile?: ModelProfile): EnhancedPrompt[] {
    return variants.map(variant => {
      const tokenCount = this.estimateTokens(variant.text);
      const score = this.calculateEfficiencyScore(variant, tokenCount, modelProfile);
      
      return {
        ...variant,
        estimatedTokens: tokenCount,
        score
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Calculate efficiency score for a variant
   */
  private calculateEfficiencyScore(
    variant: EnhancedPrompt, 
    tokenCount: number, 
    modelProfile?: ModelProfile
  ): number {
    let score = 0;
    
    // Base score from compression ratio (higher compression = higher score)
    const compressionRatio = variant.compressionRatio || 0;
    score += compressionRatio * 2; // Up to 140 points for 70% compression
    
    // Token efficiency score
    const targetTokens = this.config.tokenSavingsTarget;
    const originalTokens = this.estimateTokens(variant.meta?.originalLength ? 'x'.repeat(variant.meta.originalLength) : '');
    const actualSavings = originalTokens > 0 ? ((originalTokens - tokenCount) / originalTokens) * 100 : 0;
    
    if (actualSavings >= targetTokens) {
      score += 50; // Bonus for meeting target
    } else {
      score += (actualSavings / targetTokens) * 50; // Proportional score
    }
    
    // Model-specific scoring
    if (modelProfile) {
      score += this.calculateModelSpecificScore(tokenCount, modelProfile);
    }
    
    // Quality prediction score (heuristic-based)
    score += this.predictQualityScore(variant);
    
    // Penalty for extreme compression that might lose meaning
    if (compressionRatio > 60) {
      score -= (compressionRatio - 60) * 2; // Penalty for over-compression
    }
    
    return Math.round(score);
  }

  /**
   * Calculate model-specific scoring adjustments
   */
  private calculateModelSpecificScore(tokenCount: number, modelProfile: ModelProfile): number {
    let score = 0;
    
    // Sweet spot bonus
    const sweetSpot = modelProfile.sweetSpotTokens;
    const deviation = Math.abs(tokenCount - sweetSpot) / sweetSpot;
    
    if (deviation <= 0.1) {
      score += 30; // Perfect sweet spot
    } else if (deviation <= 0.2) {
      score += 20; // Close to sweet spot
    } else if (deviation <= 0.5) {
      score += 10; // Reasonable range
    }
    
    // Penalty for exceeding max tokens
    if (tokenCount > modelProfile.maxTokens) {
      score -= 50; // Heavy penalty for exceeding limits
    } else if (tokenCount > modelProfile.maxTokens * 0.8) {
      score -= 20; // Moderate penalty for approaching limits
    }
    
    // Model style preference adjustment
    if (modelProfile.preferredStyle) {
      score += this.getStyleScore(tokenCount, modelProfile.preferredStyle);
    }
    
    return score;
  }

  /**
   * Get style-specific scoring adjustments
   */
  private getStyleScore(tokenCount: number, style: ModelProfile['preferredStyle']): number {
    switch (style) {
      case 'imperative':
        // Prefers direct, concise prompts
        return tokenCount < 50 ? 10 : 0;
      
      case 'contextual':
        // Prefers moderate context with clear instructions
        return tokenCount >= 50 && tokenCount <= 200 ? 15 : 0;
      
      case 'descriptive':
        // Can handle longer, more detailed prompts
        return tokenCount >= 100 && tokenCount <= 300 ? 10 : 0;
      
      case 'intent':
        // Prefers clear intent with minimal fluff
        return tokenCount < 100 ? 12 : 0;
      
      default:
        return 0;
    }
  }

  /**
   * Predict quality score based on prompt characteristics
   */
  private predictQualityScore(variant: EnhancedPrompt): number {
    let score = 0;
    const text = variant.text;
    
    // Check for clarity indicators
    if (this.hasClairityIndicators(text)) {
      score += 15;
    }
    
    // Check for specificity
    if (this.hasSpecificityIndicators(text)) {
      score += 10;
    }
    
    // Check for structure
    if (this.hasGoodStructure(text)) {
      score += 10;
    }
    
    // Check for context preservation
    if (variant.meta?.slimmedContext && variant.meta.slimmedContext.length > 0) {
      score += 8;
    }
    
    // Penalty for excessive compression that might lose important details
    const compressionRatio = variant.compressionRatio || 0;
    if (compressionRatio > 70) {
      score -= 15; // Quality might suffer from over-compression
    }
    
    return score;
  }

  /**
   * Check if prompt has clarity indicators
   */
  private hasClairityIndicators(text: string): boolean {
    const clarityKeywords = [
      'create', 'generate', 'implement', 'build', 'write', 'develop',
      'function', 'class', 'method', 'component', 'algorithm',
      'should', 'must', 'needs to', 'requirement'
    ];
    
    return clarityKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Check if prompt has specificity indicators
   */
  private hasSpecificityIndicators(text: string): boolean {
    const specificityIndicators = [
      // Programming languages
      /\b(javascript|typescript|python|java|c\+\+|rust|go|php)\b/i,
      // Frameworks
      /\b(react|vue|angular|nodejs|express|django|flask|spring)\b/i,
      // Specific requirements
      /\b(return|accept|parameter|argument|input|output)\b/i,
      // Code patterns
      /```[\s\S]*```/, // code blocks
      /\b[a-zA-Z_][a-zA-Z0-9_]*\(\)/, // function calls
    ];
    
    return specificityIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Check if prompt has good structure
   */
  private hasGoodStructure(text: string): boolean {
    // Check for organized structure
    const structureIndicators = [
      /Context:\s*```/, // Has context block
      /Task:\s*/, // Has clear task definition
      /\n\s*-\s*/, // Has bullet points
      /\n\s*\d+\.\s*/, // Has numbered list
      /Requirements?:/i, // Has requirements section
      /Example:/i, // Has examples
    ];
    
    return structureIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Determine if prompt needs chunking based on token count and model limits
   */
  public needsChunking(tokenCount: number, modelProfile?: ModelProfile): boolean {
    if (!modelProfile) {
      return tokenCount > 2000; // Default threshold
    }
    
    const threshold = Math.min(
      modelProfile.maxTokens * 0.6,
      modelProfile.sweetSpotTokens * 1.5
    );
    
    return tokenCount > threshold;
  }

  /**
   * Suggest optimal chunk size for a model
   */
  public getOptimalChunkSize(modelProfile?: ModelProfile): number {
    if (!modelProfile) {
      return 1000; // Default chunk size
    }
    
    return Math.min(
      modelProfile.sweetSpotTokens,
      modelProfile.maxTokens * 0.5
    );
  }

  /**
   * Calculate token savings percentage
   */
  public calculateTokenSavings(originalText: string, enhancedText: string): number {
    const originalTokens = this.estimateTokens(originalText);
    const enhancedTokens = this.estimateTokens(enhancedText);
    
    if (originalTokens === 0) return 0;
    
    return Math.round(((originalTokens - enhancedTokens) / originalTokens) * 100);
  }

  /**
   * Get token usage statistics
   */
  public getTokenStats(variants: EnhancedPrompt[]): {
    min: number;
    max: number;
    average: number;
    bestScore: number;
    totalSavings: number;
  } {
    if (variants.length === 0) {
      return { min: 0, max: 0, average: 0, bestScore: 0, totalSavings: 0 };
    }
    
    const tokenCounts = variants.map(v => v.estimatedTokens || 0);
    const scores = variants.map(v => v.score || 0);
    
    const originalLength = variants[0].meta?.originalLength || 0;
    const originalTokens = this.estimateTokens('x'.repeat(originalLength));
    const bestTokens = Math.min(...tokenCounts);
    
    return {
      min: Math.min(...tokenCounts),
      max: Math.max(...tokenCounts),
      average: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length),
      bestScore: Math.max(...scores),
      totalSavings: originalTokens > 0 ? Math.round(((originalTokens - bestTokens) / originalTokens) * 100) : 0
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}