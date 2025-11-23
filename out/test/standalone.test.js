"use strict";
/**
 * Standalone Test Suite
 * Tests core functionality without VS Code dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandaloneTests = void 0;
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
class StandaloneTests {
    async runAllTests() {
        console.log('🧪 AI Orchestrator - Standalone Test Suite');
        console.log('='.repeat(50));
        const results = [];
        try {
            results.push(await this.testEnhancerCore());
            results.push(await this.testTokenOptimizer());
            results.push(await this.testCacheManager());
            results.push(await this.testEndToEndWorkflow());
            results.push(await this.testPerformance());
            const allPassed = results.every(r => r);
            if (allPassed) {
                console.log('\n🎉 All standalone tests passed!');
                console.log('✅ Core AI Orchestrator functionality is working correctly');
            }
            else {
                console.log('\n❌ Some tests failed');
            }
            return allPassed;
        }
        catch (error) {
            console.error('\n💥 Test suite failed with error:', error);
            return false;
        }
    }
    async testEnhancerCore() {
        console.log('\n🎯 Testing EnhancerCore...');
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        // Test basic enhancement
        const context = {
            originalPrompt: 'Create a function to validate email addresses with TypeScript',
            filePath: 'utils.ts',
            editorSnapshot: `
        interface User {
          email: string;
          name: string;
        }
        
        function validateUser(user: User) {
          // TODO: Implement validation
        }
      `,
            timestamp: Date.now()
        };
        const variants = await enhancer.enhance(context);
        console.log(`  Generated ${variants.length} variants`);
        console.log(`  First variant length: ${variants[0].text.length}`);
        console.log(`  Has slimmed context: ${variants[0].meta?.slimmedContext ? 'Yes' : 'No'}`);
        // Verify variants are different lengths (compression working)
        const hasCompression = variants.some(v => v.text.length !== context.originalPrompt.length);
        console.log(`  Compression working: ${hasCompression ? 'Yes' : 'No'}`);
        return variants.length > 0 && variants[0].text.length > 0;
    }
    async testTokenOptimizer() {
        console.log('\n📊 Testing TokenOptimizer...');
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const testPrompts = [
            'Simple prompt',
            'This is a longer prompt that should have more tokens when estimated',
            'Create a comprehensive function that handles user authentication, email validation, password hashing, and session management for a TypeScript application'
        ];
        for (const prompt of testPrompts) {
            const tokens = optimizer.estimateTokens(prompt);
            console.log(`  "${prompt.substring(0, 30)}..." -> ${tokens} tokens`);
            if (tokens <= 0) {
                console.log('  ❌ Token estimation failed');
                return false;
            }
        }
        // Test variant scoring
        const variants = [
            { id: '1', text: 'Short', compressionRatio: 20, meta: {} },
            { id: '2', text: 'Medium length text here', compressionRatio: 15, meta: {} },
            { id: '3', text: 'Very long text that goes on and on with lots of details', compressionRatio: 5, meta: {} }
        ];
        const scored = optimizer.scoreVariants(variants);
        console.log(`  Scored ${scored.length} variants`);
        console.log(`  Best score: ${scored[0].score}`);
        return scored.length === variants.length && scored[0].score !== undefined;
    }
    async testCacheManager() {
        console.log('\n💾 Testing CacheManager...');
        const cache = new cacheManager_1.CacheManager();
        // Test basic operations
        cache.put('test key', 'test value');
        const retrieved = cache.get('test key');
        console.log(`  Basic get/put: ${retrieved === 'test value' ? 'Pass' : 'Fail'}`);
        if (retrieved !== 'test value')
            return false;
        // Test similarity search
        cache.put('How to create a function', 'Function creation response');
        const similar = cache.findSimilar('How do I create a function?');
        console.log(`  Similarity search: ${similar ? 'Found' : 'Not found'}`);
        if (similar) {
            console.log(`  Similarity score: ${(similar.similarity * 100).toFixed(1)}%`);
        }
        // Test cache size management
        for (let i = 0; i < 1100; i++) {
            cache.put(`key-${i}`, `value-${i}`);
        }
        // Check if oldest entries were evicted (LRU working)
        const oldestKey = cache.get('key-0');
        const newestKey = cache.get('key-1099');
        console.log(`  LRU eviction working: ${!oldestKey && newestKey ? 'Yes' : 'No'}`);
        return !oldestKey && newestKey === 'value-1099';
    }
    async testEndToEndWorkflow() {
        console.log('\n🔄 Testing End-to-End Workflow...');
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const cache = new cacheManager_1.CacheManager();
        const originalPrompt = 'I need help creating a user authentication system with email verification, password hashing, and session management for my TypeScript Node.js application';
        const context = {
            originalPrompt,
            filePath: 'auth.ts',
            editorSnapshot: `
        interface AuthConfig {
          jwtSecret: string;
          emailProvider: string;
        }
        
        class UserAuth {
          constructor(config: AuthConfig) {}
          // Methods to implement
        }
      `,
            timestamp: Date.now()
        };
        // Step 1: Enhance
        console.log('  Step 1: Enhancing prompt...');
        const variants = await enhancer.enhance(context);
        console.log(`    Generated ${variants.length} variants`);
        // Step 2: Optimize
        console.log('  Step 2: Scoring variants...');
        const scored = optimizer.scoreVariants(variants);
        const bestVariant = scored[0];
        console.log(`    Best variant score: ${bestVariant.score}`);
        console.log(`    Token savings: ${optimizer.calculateTokenSavings(originalPrompt, bestVariant.text)}%`);
        // Step 3: Cache
        console.log('  Step 3: Caching result...');
        cache.put(originalPrompt, bestVariant.text);
        const cached = cache.get(originalPrompt);
        console.log(`    Cached successfully: ${cached === bestVariant.text ? 'Yes' : 'No'}`);
        return variants.length > 0 && bestVariant.score !== undefined && cached === bestVariant.text;
    }
    async testPerformance() {
        console.log('\n⚡ Testing Performance...');
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        // Test enhancement speed
        const startTime = Date.now();
        const context = {
            originalPrompt: 'Create a fast function for data processing',
            timestamp: Date.now()
        };
        const variants = await enhancer.enhance(context);
        const enhanceTime = Date.now() - startTime;
        console.log(`  Enhancement time: ${enhanceTime}ms`);
        // Test token optimization speed
        const startOptimize = Date.now();
        const scored = optimizer.scoreVariants(variants);
        const optimizeTime = Date.now() - startOptimize;
        console.log(`  Optimization time: ${optimizeTime}ms`);
        // Performance targets from TDD
        const enhanceTarget = 250; // ms
        const optimizeTarget = 50; // ms
        console.log(`  Enhancement meets target (<${enhanceTarget}ms): ${enhanceTime < enhanceTarget ? 'Yes' : 'No'}`);
        console.log(`  Optimization meets target (<${optimizeTarget}ms): ${optimizeTime < optimizeTarget ? 'Yes' : 'No'}`);
        return enhanceTime < enhanceTarget && optimizeTime < optimizeTarget;
    }
}
exports.StandaloneTests = StandaloneTests;
// Run tests if executed directly
if (require.main === module) {
    const tests = new StandaloneTests();
    tests.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}
//# sourceMappingURL=standalone.test.js.map