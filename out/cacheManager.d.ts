/**
 * CacheManager Module
 * Implements in-memory LRU cache for successful completions
 */
import { CacheEntry, CacheOptions } from './types';
export declare class CacheManager {
    private cache;
    private accessOrder;
    private options;
    private accessCounter;
    constructor(options?: CacheOptions);
    /**
     * Store a prompt-response pair in cache
     */
    put(prompt: string, response: string, metadata?: CacheEntry['metadata']): void;
    /**
     * Retrieve cached response for a prompt
     */
    get(prompt: string): string | null;
    /**
     * Check if a similar cached entry exists (for user confirmation)
     */
    findSimilar(prompt: string): {
        entry: CacheEntry;
        similarity: number;
    } | null;
    /**
     * Find similar entry in cache
     */
    private findSimilarEntry;
    /**
     * Normalize prompt for consistent caching
     */
    private normalizePrompt;
    /**
     * Generate simple hash for prompt
     */
    private hashPrompt;
    /**
     * Calculate similarity between two prompts using token overlap
     */
    private calculateSimilarity;
    /**
     * Generate simple embedding using character n-grams
     */
    private generateSimpleEmbedding;
    /**
     * Generate character n-grams
     */
    private generateNGrams;
    /**
     * Simple hash function
     */
    private simpleHash;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Tokenize text into words
     */
    private tokenize;
    /**
     * Check if cache entry has expired
     */
    private isExpired;
    /**
     * Evict entries if cache is over limit
     */
    private evictIfNeeded;
    /**
     * Find least recently used cache key
     */
    private findLeastRecentlyUsed;
    /**
     * Remove expired entries
     */
    cleanup(): void;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: number;
        newestEntry: number;
    };
    /**
     * Calculate cache hit rate (simplified)
     */
    private calculateHitRate;
    /**
     * Start periodic cleanup timer
     */
    private startCleanupTimer;
    /**
     * Update cache options
     */
    updateOptions(newOptions: Partial<CacheOptions>): void;
    /**
     * Export cache data (for debugging/analysis)
     */
    exportData(): CacheEntry[];
    /**
     * Get cache entry details by prompt
     */
    getEntryDetails(prompt: string): CacheEntry | null;
}
//# sourceMappingURL=cacheManager.d.ts.map