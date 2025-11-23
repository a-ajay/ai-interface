#!/usr/bin/env node

/**
 * AI Orchestrator Test Runner
 * Executes all test suites and reports results
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0
    };
  }

  async runAllTests() {
    console.log('🧪 AI Interaction Orchestrator - Test Suite Runner');
    console.log('=' .repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('');

    const startTime = Date.now();

    try {
      // Compile TypeScript first
      await this.compileTypeScript();
      
      // Run test suites in order
      await this.runTestSuite('Basic Functionality', 'test/basic.test.ts');
      await this.runTestSuite('Comprehensive Tests', 'test/comprehensive.test.ts');
      await this.runTestSuite('Performance Tests', 'test/performance.test.ts');
      await this.runTestSuite('Integration Tests', 'test/integration.test.ts');
      
      this.results.duration = Date.now() - startTime;
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async compileTypeScript() {
    console.log('🔨 Compiling TypeScript...');
    try {
      execSync('npx tsc --noEmit', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ TypeScript compilation successful');
      console.log('');
    } catch (error) {
      console.error('❌ TypeScript compilation failed');
      console.error(error.stdout?.toString() || error.message);
      throw new Error('Compilation failed');
    }
  }

  async runTestSuite(name, filePath) {
    console.log(`🧪 Running ${name}`);
    console.log('-'.repeat(50));
    
    try {
      const startTime = Date.now();
      
      // Use ts-node to run TypeScript files directly
      const result = execSync(`npx ts-node "${filePath}"`, {
        stdio: 'pipe',
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 30000 // 30 second timeout
      });
      
      const duration = Date.now() - startTime;
      
      console.log(result);
      console.log(`✅ ${name} completed in ${duration}ms`);
      console.log('');
      
      this.results.passed++;
      this.results.total++;
      
    } catch (error) {
      console.error(`❌ ${name} failed:`);
      console.error(error.stdout?.toString() || error.message);
      console.error('');
      
      this.results.failed++;
      this.results.total++;
    }
  }

  printSummary() {
    console.log('📊 Test Summary');
    console.log('=' .repeat(60));
    console.log(`Total Suites: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️ Skipped: ${this.results.skipped}`);
    console.log(`⏱️ Total Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
    console.log('');
    
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed! Extension is ready for deployment.');
    } else {
      console.log('⚠️ Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }

  // Utility method to check if all required files exist
  checkTestFiles() {
    const testFiles = [
      'test/basic.test.ts',
      'test/comprehensive.test.ts', 
      'test/performance.test.ts',
      'test/integration.test.ts'
    ];

    const missing = testFiles.filter(file => !fs.existsSync(file));
    
    if (missing.length > 0) {
      console.error('❌ Missing test files:');
      missing.forEach(file => console.error(`  - ${file}`));
      throw new Error('Test files missing');
    }
  }

  // Check if extension can be packaged
  async checkPackaging() {
    console.log('📦 Checking extension packaging...');
    
    try {
      // Check if vsce is installed
      execSync('npx vsce --version', { stdio: 'pipe' });
      
      // Try to validate the package without actually creating it
      execSync('npx vsce package --out test.vsix', { stdio: 'pipe' });
      
      // Clean up test package
      if (fs.existsSync('test.vsix')) {
        fs.unlinkSync('test.vsix');
      }
      
      console.log('✅ Extension can be packaged successfully');
      console.log('');
      
    } catch (error) {
      console.log('⚠️ Extension packaging check failed (but tests can still run)');
      console.log('   Run: npm install -g vsce');
      console.log('');
    }
  }
}

// Main execution
if (require.main === module) {
  const runner = new TestRunner();
  
  // Check prerequisites
  runner.checkTestFiles();
  
  // Run all tests
  runner.runAllTests()
    .then(() => runner.checkPackaging())
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { TestRunner };