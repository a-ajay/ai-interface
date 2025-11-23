"use strict";
/**
 * CacheManager Module
 * Implements in-memory LRU cache for successful completions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
class CacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.accessOrder = new Map(); // For LRU tracking
        this.accessCounter = 0;
        this.options = {
            maxEntries: options.maxEntries || 200,
            ttlMinutes: options.ttlMinutes || 30,
            similarityThreshold: options.similarityThreshold || 0.8
        };
        // Set up periodic cleanup
        this.startCleanupTimer();
    }
    /**
     * Store a prompt-response pair in cache
     */
    put(prompt, response, metadata) {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const hash = this.hashPrompt(normalizedPrompt);
        const entry = {
            promptHash: hash,
            normalizedPrompt,
            response,
            timestamp: Date.now(),
            metadata: metadata || {}
        };
        // Add embedding if we have enough text
        if (normalizedPrompt.length > 20) {
            entry.embedding = this.generateSimpleEmbedding(normalizedPrompt);
        }
        this.cache.set(hash, entry);
        this.accessOrder.set(hash, ++this.accessCounter);
        // Enforce size limit
        this.evictIfNeeded();
    }
    /**
     * Retrieve cached response for a prompt
     */
    get(prompt) {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const hash = this.hashPrompt(normalizedPrompt);
        // Try exact match first
        let entry = this.cache.get(hash);
        if (entry && !this.isExpired(entry)) {
            this.accessOrder.set(hash, ++this.accessCounter);
            return entry.response;
        }
        // Try similarity match
        const similarEntry = this.findSimilarEntry(normalizedPrompt);
        if (similarEntry) {
            this.accessOrder.set(similarEntry.promptHash, ++this.accessCounter);
            return similarEntry.response;
        }
        return null;
    }
    /**
     * Check if a similar cached entry exists (for user confirmation)
     */
    findSimilar(prompt) {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const similarEntry = this.findSimilarEntry(normalizedPrompt);
        if (similarEntry) {
            const similarity = this.calculateSimilarity(normalizedPrompt, similarEntry.normalizedPrompt);
            return { entry: similarEntry, similarity };
        }
        return null;
    }
    /**
     * Find similar entry in cache
     */
    findSimilarEntry(normalizedPrompt) {
        const promptEmbedding = this.generateSimpleEmbedding(normalizedPrompt);
        let bestMatch = null;
        let bestSimilarity = 0;
        for (const entry of this.cache.values()) {
            if (this.isExpired(entry))
                continue;
            let similarity;
            if (entry.embedding && promptEmbedding.length > 0) {
                // Use embedding similarity if available
                similarity = this.cosineSimilarity(promptEmbedding, entry.embedding);
            }
            else {
                // Fallback to token-based similarity
                similarity = this.calculateSimilarity(normalizedPrompt, entry.normalizedPrompt);
            }
            if (similarity > bestSimilarity && similarity >= this.options.similarityThreshold) {
                bestSimilarity = similarity;
                bestMatch = entry;
            }
        }
        return bestMatch;
    }
    /**
     * Normalize prompt for consistent caching
     */
    normalizePrompt(prompt) {
        return prompt
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            // Remove common variations that don't change meaning
            .replace(/\bplease\b/g, '')
            .replace(/\bcan you\b/g, '')
            .replace(/\bcould you\b/g, '');
    }
    /**
     * Generate simple hash for prompt
     */
    hashPrompt(prompt) {
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Calculate similarity between two prompts using token overlap
     */
    calculateSimilarity(prompt1, prompt2) {
        const tokens1 = this.tokenize(prompt1);
        const tokens2 = this.tokenize(prompt2);
        if (tokens1.length === 0 || tokens2.length === 0)
            return 0;
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(token => set2.has(token)));
        const union = new Set([...set1, ...set2]);
        // Jaccard similarity
        return intersection.size / union.size;
    }
    /**
     * Generate simple embedding using character n-grams
     */
    generateSimpleEmbedding(text) {
        const embedding = new Array(64).fill(0);
        const ngrams = this.generateNGrams(text, 3);
        for (const ngram of ngrams) {
            const hash = this.simpleHash(ngram) % embedding.length;
            embedding[hash] += 1;
        }
        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= magnitude;
            }
        }
        return embedding;
    }
    /**
     * Generate character n-grams
     */
    generateNGrams(text, n) {
        const ngrams = [];
        const cleanText = text.replace(/[^\w\s]/g, '').toLowerCase();
        for (let i = 0; i <= cleanText.length - n; i++) {
            ngrams.push(cleanText.substring(i, i + n));
        }
        return ngrams;
    }
    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length)
            return 0;
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }
    /**
     * Tokenize text into words
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2);
    }
    /**
     * Check if cache entry has expired
     */
    isExpired(entry) {
        const now = Date.now();
        const ttlMs = this.options.ttlMinutes * 60 * 1000;
        return (now - entry.timestamp) > ttlMs;
    }
    /**
     * Evict entries if cache is over limit
     */
    evictIfNeeded() {
        if (this.cache.size <= this.options.maxEntries)
            return;
        // Remove expired entries first
        this.cleanup();
        // If still over limit, remove least recently used
        while (this.cache.size > this.options.maxEntries) {
            const lruKey = this.findLeastRecentlyUsed();
            if (lruKey) {
                this.cache.delete(lruKey);
                this.accessOrder.delete(lruKey);
            }
            else {
                break; // Shouldn't happen, but prevent infinite loop
            }
        }
    }
    /**
     * Find least recently used cache key
     */
    findLeastRecentlyUsed() {
        let lruKey = null;
        let oldestAccess = Infinity;
        for (const [key, accessTime] of this.accessOrder) {
            if (accessTime < oldestAccess) {
                oldestAccess = accessTime;
                lruKey = key;
            }
        }
        return lruKey;
    }
    /**
     * Remove expired entries
     */
    cleanup() {
        const expiredKeys = [];
        for (const [key, entry] of this.cache) {
            if (this.isExpired(entry)) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        }
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
        this.accessCounter = 0;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
        return {
            size: this.cache.size,
            maxSize: this.options.maxEntries,
            hitRate: this.calculateHitRate(),
            oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
        };
    }
    /**
     * Calculate cache hit rate (simplified)
     */
    calculateHitRate() {
        // This is a simplified calculation
        // In a real implementation, you'd track hits vs misses
        return this.cache.size > 0 ? 0.75 : 0; // Placeholder
    }
    /**
     * Start periodic cleanup timer
     */
    startCleanupTimer() {
        // Cleanup every 5 minutes
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    /**
     * Update cache options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        // Evict if new max size is smaller
        if (newOptions.maxEntries && newOptions.maxEntries < this.cache.size) {
            this.evictIfNeeded();
        }
    }
    /**
     * Export cache data (for debugging/analysis)
     */
    exportData() {
        return Array.from(this.cache.values());
    }
    /**
     * Get cache entry details by prompt
     */
    getEntryDetails(prompt) {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const hash = this.hashPrompt(normalizedPrompt);
        return this.cache.get(hash) || null;
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=cacheManager.js.map