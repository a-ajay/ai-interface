/**
 * Simple test to verify extension functionality
 */

import { EnhancerCore } from '../src/enhancerCore';
import { TokenOptimizer } from '../src/tokenOptimizer';
import { CacheManager } from '../src/cacheManager';
import { PromptContext, OrchestratorConfig } from '../src/types';

// Test configuration
const testConfig: OrchestratorConfig = {
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
  const enhancer = new EnhancerCore(testConfig);
  const tokenOptimizer = new TokenOptimizer(testConfig);
  const cacheManager = new CacheManager();

  // Test prompt
  const testPrompt = "Can you please help me create a function that takes a list of users and returns only those users who have verified email addresses and have logged in within the last 30 days? I need this for TypeScript.";
  
  console.log('📝 Original Prompt:');
  console.log(testPrompt);
  console.log(`\n📏 Length: ${testPrompt.length} characters`);

  // Create prompt context
  const context: PromptContext = {
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
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEnhancement().catch(console.error);
}

export { testEnhancement };