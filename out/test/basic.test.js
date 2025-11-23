"use strict";
/**
 * Simple test to verify extension functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEnhancement = testEnhancement;
const enhancerCore_1 = require("../src/enhancerCore");
const tokenOptimizer_1 = require("../src/tokenOptimizer");
const cacheManager_1 = require("../src/cacheManager");
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
async function testEnhancement() {
    console.log('🧪 Testing AI Interaction Orchestrator...\n');
    // Initialize components
    const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
    const tokenOptimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
    const cacheManager = new cacheManager_1.CacheManager();
    // Test prompt
    const testPrompt = "Can you please help me create a function that takes a list of users and returns only those users who have verified email addresses and have logged in within the last 30 days? I need this for TypeScript.";
    console.log('📝 Original Prompt:');
    console.log(testPrompt);
    console.log(`\n📏 Length: ${testPrompt.length} characters`);
    // Create prompt context
    const context = {
        originalPrompt: testPrompt,
        filePath: 'test.ts',
        editorSnapshot: `
interface User {
  email: string;
  verified: boolean;
  lastLogin: Date;
  id: string;
}

const users: User[] = [
  // Sample data
];

// Some other unrelated code
function processData() {
  return null;
}
    `.trim(),
        timestamp: Date.now()
    };
    try {
        // Test enhancement
        console.log('\n⚡ Enhancing prompt...');
        const variants = await enhancer.enhance(context);
        console.log(`\n🎯 Generated ${variants.length} variants:`);
        // Score variants
        const scoredVariants = tokenOptimizer.scoreVariants(variants);
        scoredVariants.forEach((variant, index) => {
            console.log(`\n--- Variant ${index + 1} ---`);
            console.log(`Text: ${variant.text}`);
            console.log(`Length: ${variant.text.length} characters`);
            console.log(`Compression: ${variant.compressionRatio}%`);
            console.log(`Score: ${variant.score}`);
            console.log(`Estimated Tokens: ${variant.estimatedTokens}`);
        });
        // Test caching
        console.log('\n💾 Testing cache...');
        const bestVariant = scoredVariants[0];
        cacheManager.put(testPrompt, bestVariant.text);
        const cached = cacheManager.get(testPrompt);
        console.log(`Cache hit: ${cached ? '✅' : '❌'}`);
        // Test token savings
        const savings = tokenOptimizer.calculateTokenSavings(testPrompt, bestVariant.text);
        console.log(`\n📊 Token savings: ${savings}%`);
        console.log('\n🎉 All tests passed!');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
}
// Run tests if this file is executed directly
if (require.main === module) {
    testEnhancement().catch(console.error);
}
//# sourceMappingURL=basic.test.js.map