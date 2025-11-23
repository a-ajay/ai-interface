"use strict";
/**
 * Comprehensive Test Suite for AI Interaction Orchestrator
 * Tests all components and functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSuite = void 0;
const enhancerCore_1 = require("../src/enhancerCore");
const tokenOptimizer_1 = require("../src/tokenOptimizer");
const cacheManager_1 = require("../src/cacheManager");
const promptIntercept_1 = require("../src/promptIntercept");
const uiManager_1 = require("../src/uiManager");
// Mock VS Code API for testing
const mockVscode = {
    window: {
        createStatusBarItem: () => ({
            text: '',
            tooltip: '',
            command: '',
            show: () => { },
            hide: () => { },
            dispose: () => { }
        }),
        showInformationMessage: (msg) => Promise.resolve(msg),
        showWarningMessage: (msg) => Promise.resolve(msg),
        showErrorMessage: (msg) => Promise.resolve(msg),
        createWebviewPanel: () => ({
            webview: { html: '', onDidReceiveMessage: () => { } },
            dispose: () => { },
            onDidDispose: () => { }
        })
    },
    StatusBarAlignment: { Right: 2 },
    ThemeColor: class {
        constructor(id) {
            this.id = id;
        }
    },
    ViewColumn: { Beside: 2, One: 1 },
    EventEmitter: class {
        constructor() {
            this.event = () => { };
            this.fire = (data) => { };
            this.dispose = () => { };
        }
    },
    Disposable: class {
        static from(...disposables) { return { dispose: () => { } }; }
    }
};
// Mock the extension context
const mockContext = {
    subscriptions: [],
    globalState: {
        get: (key) => undefined,
        update: (key, value) => Promise.resolve()
    }
};
// Replace vscode imports for testing
global.vscode = mockVscode;
// Test configuration
const testConfig = {
    enabled: true,
    compressionLevel: 'moderate',
    tokenSavingsTarget: 30,
    enableWebSync: false,
    cacheTimeout: 30,
    chunkThreshold: 2000,
    maxConcurrentChunks: 3
};
class TestSuite {
    constructor() {
        this.results = {};
        this.errors = {};
    }
    async runAllTests() {
        console.log('🧪 AI Interaction Orchestrator - Comprehensive Test Suite');
        console.log('='.repeat(60));
        // Component Tests
        await this.testEnhancerCore();
        await this.testTokenOptimizer();
        await this.testCacheManager();
        await this.testPromptIntercept();
        await this.testUIManager();
        // Integration Tests
        await this.testEndToEndWorkflow();
        await this.testConfigurationHandling();
        await this.testErrorHandling();
        await this.testPerformance();
        // Feature Tests
        await this.testCompressionLevels();
        await this.testContextSlimming();
        await this.testCacheSemantics();
        this.printResults();
    }
    async test(name, testFn) {
        try {
            console.log(`\n🔍 Testing: ${name}`);
            await testFn();
            this.results[name] = 'PASS';
            console.log(`✅ ${name}: PASSED`);
        }
        catch (error) {
            this.results[name] = 'FAIL';
            this.errors[name] = error instanceof Error ? error.message : String(error);
            console.log(`❌ ${name}: FAILED - ${this.errors[name]}`);
        }
    }
    // Test EnhancerCore functionality
    async testEnhancerCore() {
        console.log('\n📦 Testing EnhancerCore Module');
        console.log('-'.repeat(40));
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        await this.test('EnhancerCore: Basic Enhancement', async () => {
            const context = {
                originalPrompt: "Can you please help me create a function that processes data?",
                editorSnapshot: "function example() { return null; }",
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            if (variants.length === 0)
                throw new Error('No variants generated');
            if (!variants[0].id)
                throw new Error('Variant missing ID');
            if (!variants[0].text)
                throw new Error('Variant missing text');
        });
        await this.test('EnhancerCore: Context Slimming', async () => {
            const context = {
                originalPrompt: "Create a user validation function",
                editorSnapshot: `
          // This is a comment that should be removed
          import { unnecessary } from 'unused-lib';
          import { User } from 'models';
          
          interface User {
            email: string;
            verified: boolean;
          }
          
          function someOtherFunction() {
            // Another comment
            return "irrelevant";
          }
        `,
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const slimmedContext = variants[0].meta?.slimmedContext;
            if (!slimmedContext)
                throw new Error('Context not slimmed');
            if (slimmedContext.includes('This is a comment')) {
                throw new Error('Comments not properly removed');
            }
            if (slimmedContext.includes('unnecessary')) {
                throw new Error('Unused imports not removed');
            }
        });
        await this.test('EnhancerCore: Compression Rules', async () => {
            const context = {
                originalPrompt: "Can you please help me create a function that will process the data",
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const compressed = variants[0].text;
            if (compressed.includes('Can you please')) {
                throw new Error('Polite prefixes not removed');
            }
            if (compressed.includes('that will')) {
                throw new Error('Verbose phrases not compressed');
            }
        });
        await this.test('EnhancerCore: Multiple Variants', async () => {
            const aggressiveConfig = { ...testConfig, compressionLevel: 'aggressive' };
            const aggressiveEnhancer = new enhancerCore_1.EnhancerCore(aggressiveConfig);
            const context = {
                originalPrompt: "Please create a detailed function that processes user data with validation",
                timestamp: Date.now()
            };
            const variants = await aggressiveEnhancer.enhance(context);
            if (variants.length < 2)
                throw new Error('Multiple variants not generated');
            // Check compression ratios are different
            const ratios = variants.map(v => v.compressionRatio || 0);
            if (ratios.every(r => r === ratios[0])) {
                throw new Error('Variants have identical compression ratios');
            }
        });
        await this.test('EnhancerCore: Configuration Update', () => {
            const newConfig = { ...testConfig, compressionLevel: 'light' };
            enhancer.updateConfig(newConfig);
            // Should not throw
        });
    }
    // Test TokenOptimizer functionality
    async testTokenOptimizer() {
        console.log('\n🔢 Testing TokenOptimizer Module');
        console.log('-'.repeat(40));
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        await this.test('TokenOptimizer: Token Estimation', () => {
            const text = "Create a function that processes data";
            const tokens = optimizer.estimateTokens(text);
            if (tokens <= 0)
                throw new Error('Invalid token count');
            if (tokens > 100)
                throw new Error('Token count seems too high');
        });
        await this.test('TokenOptimizer: Variant Scoring', () => {
            const variants = [
                {
                    id: 'v1',
                    text: 'Create function for data processing',
                    compressionRatio: 30,
                    meta: { originalLength: 50 }
                },
                {
                    id: 'v2',
                    text: 'Please create a detailed function that will process all the data',
                    compressionRatio: 10,
                    meta: { originalLength: 50 }
                }
            ];
            const scored = optimizer.scoreVariants(variants);
            if (scored.length !== 2)
                throw new Error('Incorrect number of scored variants');
            if (scored[0].score === undefined)
                throw new Error('Score not calculated');
            if (scored[0].estimatedTokens === undefined)
                throw new Error('Token count not estimated');
        });
        await this.test('TokenOptimizer: Model-Specific Scoring', () => {
            const modelProfile = {
                id: 'test-model',
                provider: 'openai',
                name: 'Test Model',
                sweetSpotTokens: 100,
                maxTokens: 1000,
                preferredStyle: 'imperative'
            };
            const variants = [{
                    id: 'v1',
                    text: 'Short prompt',
                    compressionRatio: 50
                }];
            const scored = optimizer.scoreVariants(variants, modelProfile);
            if (!scored[0].score)
                throw new Error('Model-specific scoring failed');
        });
        await this.test('TokenOptimizer: Chunking Decision', () => {
            const smallText = 'Small prompt';
            const largeText = 'x'.repeat(3000);
            if (optimizer.needsChunking(optimizer.estimateTokens(smallText))) {
                throw new Error('Small text incorrectly marked for chunking');
            }
            if (!optimizer.needsChunking(optimizer.estimateTokens(largeText))) {
                throw new Error('Large text not marked for chunking');
            }
        });
        await this.test('TokenOptimizer: Token Savings Calculation', () => {
            const original = 'Can you please help me create a function';
            const enhanced = 'Create function';
            const savings = optimizer.calculateTokenSavings(original, enhanced);
            if (savings <= 0)
                throw new Error('No token savings calculated');
            if (savings > 100)
                throw new Error('Invalid savings percentage');
        });
    }
    // Test CacheManager functionality  
    async testCacheManager() {
        console.log('\n💾 Testing CacheManager Module');
        console.log('-'.repeat(40));
        const cache = new cacheManager_1.CacheManager({ maxEntries: 5, ttlMinutes: 1 });
        await this.test('CacheManager: Basic Put/Get', () => {
            const prompt = 'Create a function';
            const response = 'function create() { }';
            cache.put(prompt, response);
            const cached = cache.get(prompt);
            if (cached !== response)
                throw new Error('Cache get/put failed');
        });
        await this.test('CacheManager: Similarity Matching', () => {
            const prompt1 = 'Create a function for data processing';
            const prompt2 = 'Create function for processing data'; // Similar
            const response = 'function process() { }';
            cache.clear();
            cache.put(prompt1, response);
            const similar = cache.findSimilar(prompt2);
            if (!similar)
                throw new Error('Similar prompt not found');
            if (similar.similarity <= 0.5)
                throw new Error('Similarity score too low');
        });
        await this.test('CacheManager: LRU Eviction', () => {
            cache.clear();
            // Fill cache beyond limit
            for (let i = 0; i < 10; i++) {
                cache.put(`prompt${i}`, `response${i}`);
            }
            const stats = cache.getStats();
            if (stats.size > 5)
                throw new Error('LRU eviction not working');
        });
        await this.test('CacheManager: TTL Expiration', async () => {
            const shortCache = new cacheManager_1.CacheManager({ maxEntries: 10, ttlMinutes: 0.001 }); // Very short TTL
            shortCache.put('test', 'response');
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 100));
            const cached = shortCache.get('test');
            if (cached !== null)
                throw new Error('TTL expiration not working');
        });
        await this.test('CacheManager: Statistics', () => {
            cache.clear();
            cache.put('test1', 'response1');
            cache.put('test2', 'response2');
            const stats = cache.getStats();
            if (stats.size !== 2)
                throw new Error('Incorrect cache size');
            if (stats.maxSize !== 5)
                throw new Error('Incorrect max size');
        });
    }
    // Test PromptIntercept functionality
    async testPromptIntercept() {
        console.log('\n🎯 Testing PromptIntercept Module');
        console.log('-'.repeat(40));
        // Note: Full testing requires VS Code API, so we test what we can
        await this.test('PromptIntercept: Context Extraction', () => {
            const intercept = new promptIntercept_1.PromptIntercept(mockContext);
            const context = intercept.extractPromptContext('Test prompt');
            if (!context.originalPrompt)
                throw new Error('Original prompt not captured');
            if (!context.timestamp)
                throw new Error('Timestamp not set');
            intercept.dispose();
        });
        await this.test('PromptIntercept: Prompt Detection Heuristics', () => {
            const intercept = new promptIntercept_1.PromptIntercept(mockContext);
            // Test private method through reflection
            const looksLikePrompt = intercept.looksLikePrompt;
            if (!looksLikePrompt('Create a function that processes data')) {
                throw new Error('Valid prompt not detected');
            }
            if (looksLikePrompt('x')) {
                throw new Error('Invalid prompt incorrectly detected');
            }
            intercept.dispose();
        });
        await this.test('PromptIntercept: Manual Prompt Setting', () => {
            const intercept = new promptIntercept_1.PromptIntercept(mockContext);
            const testPrompt = 'Manual test prompt';
            const context = intercept.setPrompt(testPrompt);
            if (context.originalPrompt !== testPrompt) {
                throw new Error('Manual prompt not set correctly');
            }
            intercept.dispose();
        });
    }
    // Test UIManager functionality
    async testUIManager() {
        console.log('\n🎨 Testing UIManager Module');
        console.log('-'.repeat(40));
        const ui = new uiManager_1.UIManager(mockContext);
        await this.test('UIManager: Initialization', () => {
            // Should not throw during initialization
            if (!ui)
                throw new Error('UIManager not initialized');
        });
        await this.test('UIManager: Metrics Update', () => {
            ui.updateMetrics({
                totalPrompts: 10,
                totalTokensSaved: 500,
                averageCompressionRatio: 35
            });
            // Should not throw
        });
        await this.test('UIManager: Notification Display', () => {
            ui.showNotification('Test message', 'info');
            ui.showNotification('Test warning', 'warning');
            ui.showNotification('Test error', 'error');
            // Should not throw
        });
        ui.dispose();
    }
    // Test end-to-end workflow
    async testEndToEndWorkflow() {
        console.log('\n🔄 Testing End-to-End Workflow');
        console.log('-'.repeat(40));
        await this.test('E2E: Complete Enhancement Workflow', async () => {
            const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
            const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
            const cache = new cacheManager_1.CacheManager();
            // 1. Create context
            const context = {
                originalPrompt: "Can you please help me create a comprehensive function that validates user email addresses?",
                editorSnapshot: `
          interface User {
            email: string;
            verified: boolean;
          }
        `,
                timestamp: Date.now()
            };
            // 2. Enhance prompt
            const variants = await enhancer.enhance(context);
            if (variants.length === 0)
                throw new Error('No variants generated');
            // 3. Optimize tokens
            const scored = optimizer.scoreVariants(variants);
            if (!scored[0].estimatedTokens)
                throw new Error('Tokens not estimated');
            // 4. Cache result
            cache.put(context.originalPrompt, scored[0].text);
            const cached = cache.get(context.originalPrompt);
            if (!cached)
                throw new Error('Caching failed');
            // 5. Calculate savings
            const savings = optimizer.calculateTokenSavings(context.originalPrompt, scored[0].text);
            if (savings <= 0)
                throw new Error('No token savings achieved');
        });
    }
    // Test configuration handling
    async testConfigurationHandling() {
        console.log('\n⚙️ Testing Configuration Handling');
        console.log('-'.repeat(40));
        await this.test('Config: Different Compression Levels', async () => {
            const configs = [
                { ...testConfig, compressionLevel: 'light' },
                { ...testConfig, compressionLevel: 'moderate' },
                { ...testConfig, compressionLevel: 'aggressive' }
            ];
            const context = {
                originalPrompt: "Please help me create a detailed function",
                timestamp: Date.now()
            };
            const results = [];
            for (const config of configs) {
                const enhancer = new enhancerCore_1.EnhancerCore(config);
                const variants = await enhancer.enhance(context);
                results.push(variants[0].compressionRatio || 0);
            }
            // Aggressive should have highest compression
            if (results[2] <= results[0]) {
                throw new Error('Compression levels not working correctly');
            }
        });
        await this.test('Config: Token Savings Target', () => {
            const lowTarget = { ...testConfig, tokenSavingsTarget: 10 };
            const highTarget = { ...testConfig, tokenSavingsTarget: 50 };
            const optimizer1 = new tokenOptimizer_1.TokenOptimizer(lowTarget);
            const optimizer2 = new tokenOptimizer_1.TokenOptimizer(highTarget);
            // Should not throw
            optimizer1.updateConfig(highTarget);
            optimizer2.updateConfig(lowTarget);
        });
    }
    // Test error handling
    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling');
        console.log('-'.repeat(40));
        await this.test('Error: Empty Prompt Handling', async () => {
            const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
            const context = {
                originalPrompt: '',
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            // Should handle gracefully, not throw
            if (variants.length > 0 && !variants[0].text) {
                throw new Error('Empty prompt not handled properly');
            }
        });
        await this.test('Error: Invalid Cache Operations', () => {
            const cache = new cacheManager_1.CacheManager();
            // These should not throw
            cache.get('nonexistent');
            cache.clear();
            cache.cleanup();
        });
        await this.test('Error: Token Estimation Edge Cases', () => {
            const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
            // These should not throw
            optimizer.estimateTokens('');
            optimizer.estimateTokens('x'.repeat(10000));
            optimizer.calculateTokenSavings('', '');
        });
    }
    // Test performance
    async testPerformance() {
        console.log('\n⚡ Testing Performance');
        console.log('-'.repeat(40));
        await this.test('Performance: Enhancement Speed', async () => {
            const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
            const context = {
                originalPrompt: "Create a function that processes data efficiently",
                timestamp: Date.now()
            };
            const start = Date.now();
            await enhancer.enhance(context);
            const duration = Date.now() - start;
            if (duration > 1000)
                throw new Error(`Enhancement too slow: ${duration}ms`);
        });
        await this.test('Performance: Token Estimation Speed', () => {
            const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
            const longText = 'word '.repeat(1000);
            const start = Date.now();
            optimizer.estimateTokens(longText);
            const duration = Date.now() - start;
            if (duration > 500)
                throw new Error(`Token estimation too slow: ${duration}ms`);
        });
        await this.test('Performance: Cache Operations Speed', () => {
            const cache = new cacheManager_1.CacheManager();
            const start = Date.now();
            for (let i = 0; i < 100; i++) {
                cache.put(`prompt${i}`, `response${i}`);
                cache.get(`prompt${i}`);
            }
            const duration = Date.now() - start;
            if (duration > 100)
                throw new Error(`Cache operations too slow: ${duration}ms`);
        });
    }
    // Test compression levels
    async testCompressionLevels() {
        console.log('\n📊 Testing Compression Levels');
        console.log('-'.repeat(40));
        const testPrompt = "Can you please help me create a detailed function that will process all the user data efficiently?";
        await this.test('Compression: Light Level', async () => {
            const config = { ...testConfig, compressionLevel: 'light' };
            const enhancer = new enhancerCore_1.EnhancerCore(config);
            const context = { originalPrompt: testPrompt, timestamp: Date.now() };
            const variants = await enhancer.enhance(context);
            const ratio = variants[0].compressionRatio || 0;
            if (ratio > 30)
                throw new Error('Light compression too aggressive');
        });
        await this.test('Compression: Aggressive Level', async () => {
            const config = { ...testConfig, compressionLevel: 'aggressive' };
            const enhancer = new enhancerCore_1.EnhancerCore(config);
            const context = { originalPrompt: testPrompt, timestamp: Date.now() };
            const variants = await enhancer.enhance(context);
            // Should have multiple variants with higher compression
            if (variants.length < 2)
                throw new Error('Aggressive mode should generate multiple variants');
        });
    }
    // Test context slimming edge cases
    async testContextSlimming() {
        console.log('\n✂️ Testing Context Slimming Edge Cases');
        console.log('-'.repeat(40));
        await this.test('Context: Large Code File', async () => {
            const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
            const largeSnapshot = `
        // Large file with many imports and functions
        ${Array.from({ length: 50 }, (_, i) => `import { Module${i} } from 'lib${i}';`).join('\n')}
        
        ${Array.from({ length: 20 }, (_, i) => `
          function func${i}() {
            // Comment ${i}
            return ${i};
          }
        `).join('\n')}
      `;
            const context = {
                originalPrompt: "Create a new function",
                editorSnapshot: largeSnapshot,
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const slimmedSize = variants[0].meta?.slimmedContext?.length || 0;
            if (slimmedSize >= largeSnapshot.length) {
                throw new Error('Context not properly slimmed');
            }
        });
        await this.test('Context: Code with Relevance', async () => {
            const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
            const context = {
                originalPrompt: "Fix the validateUser function",
                editorSnapshot: `
          function validateUser(user) {
            return user.email && user.verified;
          }
          
          function unrelatedFunction() {
            return Math.random();
          }
        `,
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const slimmed = variants[0].meta?.slimmedContext || '';
            if (!slimmed.includes('validateUser')) {
                throw new Error('Relevant function not preserved');
            }
            if (slimmed.includes('unrelatedFunction')) {
                throw new Error('Irrelevant function not removed');
            }
        });
    }
    // Test cache semantics
    async testCacheSemantics() {
        console.log('\n🧠 Testing Cache Semantic Matching');
        console.log('-'.repeat(40));
        await this.test('Cache: Semantic Similarity', () => {
            const cache = new cacheManager_1.CacheManager({ similarityThreshold: 0.7 });
            cache.put('Create a user validation function', 'function validate() {}');
            const similar = cache.findSimilar('Build a function to validate users');
            if (!similar)
                throw new Error('Semantically similar prompt not found');
            if (similar.similarity < 0.7)
                throw new Error('Similarity threshold not working');
        });
        await this.test('Cache: Normalization', () => {
            const cache = new cacheManager_1.CacheManager();
            cache.put('Create   a    function', 'result1');
            const result = cache.get('Create a function'); // Different spacing
            if (result !== 'result1')
                throw new Error('Prompt normalization failed');
        });
    }
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        let passed = 0;
        let failed = 0;
        Object.entries(this.results).forEach(([test, result]) => {
            const status = result === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${test}`);
            if (result === 'PASS')
                passed++;
            else {
                failed++;
                if (this.errors[test]) {
                    console.log(`   Error: ${this.errors[test]}`);
                }
            }
        });
        console.log('-'.repeat(60));
        console.log(`📊 Total Tests: ${passed + failed}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! 🎉');
            console.log('The AI Interaction Orchestrator is working perfectly! 🚀');
        }
        else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
        }
    }
}
exports.TestSuite = TestSuite;
// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new TestSuite();
    testSuite.runAllTests().catch(console.error);
}
//# sourceMappingURL=comprehensive.test.js.map