"use strict";
/**
 * Performance and Load Tests
 * Tests extension performance under various conditions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTests = void 0;
const enhancerCore_1 = require("../src/enhancerCore");
const tokenOptimizer_1 = require("../src/tokenOptimizer");
const cacheManager_1 = require("../src/cacheManager");
const testConfig = {
    enabled: true,
    compressionLevel: 'moderate',
    tokenSavingsTarget: 30,
    enableWebSync: false,
    cacheTimeout: 30,
    chunkThreshold: 2000,
    maxConcurrentChunks: 3
};
class PerformanceTests {
    async runPerformanceTests() {
        console.log('⚡ AI Orchestrator - Performance Test Suite');
        console.log('='.repeat(50));
        await this.testEnhancementPerformance();
        await this.testTokenOptimizationPerformance();
        await this.testCachePerformance();
        await this.testMemoryUsage();
        await this.testConcurrentOperations();
        await this.testLargePromptHandling();
    }
    async testEnhancementPerformance() {
        console.log('\n🚀 Testing Enhancement Performance');
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const tests = [
            { name: 'Short prompt', text: 'Create a function' },
            { name: 'Medium prompt', text: 'Can you please help me create a comprehensive function that validates user email addresses and returns detailed validation results?' },
            { name: 'Long prompt', text: 'I need your assistance in creating a highly optimized, well-documented, and thoroughly tested function that can validate user email addresses, handle various edge cases, perform comprehensive security checks, and return detailed validation results with appropriate error messages and suggestions for improvement. The function should also support internationalization and be compatible with multiple email formats.' }
        ];
        for (const test of tests) {
            const context = {
                originalPrompt: test.text,
                timestamp: Date.now()
            };
            const startTime = performance.now();
            const variants = await enhancer.enhance(context);
            const duration = performance.now() - startTime;
            console.log(`  ${test.name}: ${duration.toFixed(2)}ms (${variants.length} variants)`);
            if (duration > 500) {
                console.log(`  ⚠️  Warning: ${test.name} took ${duration.toFixed(2)}ms (>500ms)`);
            }
        }
    }
    async testTokenOptimizationPerformance() {
        console.log('\n🔢 Testing Token Optimization Performance');
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const texts = [
            'x'.repeat(100),
            'x'.repeat(1000),
            'x'.repeat(5000)
        ];
        texts.forEach((text, i) => {
            const startTime = performance.now();
            const tokens = optimizer.estimateTokens(text);
            const duration = performance.now() - startTime;
            console.log(`  ${text.length} chars: ${duration.toFixed(2)}ms (${tokens} tokens)`);
            if (duration > 100) {
                console.log(`  ⚠️  Warning: Token estimation for ${text.length} chars took ${duration.toFixed(2)}ms`);
            }
        });
    }
    async testCachePerformance() {
        console.log('\n💾 Testing Cache Performance');
        const cache = new cacheManager_1.CacheManager({ maxEntries: 1000 });
        // Test bulk insertion
        const startInsert = performance.now();
        for (let i = 0; i < 1000; i++) {
            cache.put(`prompt${i}`, `response${i}`);
        }
        const insertDuration = performance.now() - startInsert;
        console.log(`  Bulk insert (1000 items): ${insertDuration.toFixed(2)}ms`);
        // Test retrieval performance
        const startRetrieve = performance.now();
        for (let i = 0; i < 1000; i++) {
            cache.get(`prompt${i}`);
        }
        const retrieveDuration = performance.now() - startRetrieve;
        console.log(`  Bulk retrieve (1000 items): ${retrieveDuration.toFixed(2)}ms`);
        // Test similarity search performance
        const startSimilarity = performance.now();
        for (let i = 0; i < 100; i++) {
            cache.findSimilar(`similar prompt ${i}`);
        }
        const similarityDuration = performance.now() - startSimilarity;
        console.log(`  Similarity search (100 items): ${similarityDuration.toFixed(2)}ms`);
    }
    async testMemoryUsage() {
        console.log('\n🧠 Testing Memory Usage');
        const getMemoryUsage = () => {
            if (typeof process !== 'undefined' && process.memoryUsage) {
                return process.memoryUsage().heapUsed / 1024 / 1024; // MB
            }
            return 0;
        };
        const initialMemory = getMemoryUsage();
        // Create multiple components
        const components = Array.from({ length: 10 }, () => ({
            enhancer: new enhancerCore_1.EnhancerCore(testConfig),
            optimizer: new tokenOptimizer_1.TokenOptimizer(testConfig),
            cache: new cacheManager_1.CacheManager({ maxEntries: 100 })
        }));
        // Fill caches
        components.forEach((comp, i) => {
            for (let j = 0; j < 100; j++) {
                comp.cache.put(`prompt${i}-${j}`, `response${i}-${j}`);
            }
        });
        const peakMemory = getMemoryUsage();
        const memoryIncrease = peakMemory - initialMemory;
        console.log(`  Initial memory: ${initialMemory.toFixed(2)}MB`);
        console.log(`  Peak memory: ${peakMemory.toFixed(2)}MB`);
        console.log(`  Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        if (memoryIncrease > 50) {
            console.log(`  ⚠️  Warning: High memory usage detected (${memoryIncrease.toFixed(2)}MB)`);
        }
    }
    async testConcurrentOperations() {
        console.log('\n🔄 Testing Concurrent Operations');
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const contexts = Array.from({ length: 10 }, (_, i) => ({
            originalPrompt: `Create function ${i} for data processing`,
            timestamp: Date.now()
        }));
        const startTime = performance.now();
        // Run concurrent enhancements
        const promises = contexts.map(context => enhancer.enhance(context));
        const results = await Promise.all(promises);
        const duration = performance.now() - startTime;
        console.log(`  Concurrent enhancements (10): ${duration.toFixed(2)}ms`);
        console.log(`  Average per enhancement: ${(duration / 10).toFixed(2)}ms`);
        if (results.some(variants => variants.length === 0)) {
            console.log(`  ❌ Some concurrent operations failed`);
        }
        else {
            console.log(`  ✅ All concurrent operations succeeded`);
        }
    }
    async testLargePromptHandling() {
        console.log('\n📏 Testing Large Prompt Handling');
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        // Create very large prompt
        const largePrompt = Array.from({ length: 100 }, (_, i) => `Please create a detailed function ${i} that processes data efficiently.`).join(' ');
        console.log(`  Large prompt size: ${largePrompt.length} characters`);
        const context = {
            originalPrompt: largePrompt,
            timestamp: Date.now()
        };
        const startTime = performance.now();
        const variants = await enhancer.enhance(context);
        const duration = performance.now() - startTime;
        console.log(`  Enhancement time: ${duration.toFixed(2)}ms`);
        console.log(`  Variants generated: ${variants.length}`);
        if (variants.length > 0) {
            const tokenCount = optimizer.estimateTokens(variants[0].text);
            console.log(`  Token estimate: ${tokenCount} tokens`);
            console.log(`  Compression ratio: ${variants[0].compressionRatio}%`);
            if (optimizer.needsChunking(tokenCount)) {
                const chunkSize = optimizer.getOptimalChunkSize();
                console.log(`  Would need chunking: ${Math.ceil(tokenCount / chunkSize)} chunks`);
            }
        }
    }
}
exports.PerformanceTests = PerformanceTests;
// Run performance tests if this file is executed directly
if (require.main === module) {
    const perfTests = new PerformanceTests();
    perfTests.runPerformanceTests().catch(console.error);
}
//# sourceMappingURL=performance.test.js.map