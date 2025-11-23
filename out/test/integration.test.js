"use strict";
/**
 * Integration Tests
 * Tests real-world usage scenarios and workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationTests = void 0;
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
class IntegrationTests {
    async runIntegrationTests() {
        console.log('🔗 AI Orchestrator - Integration Test Suite');
        console.log('='.repeat(50));
        await this.testTypicalUserWorkflow();
        await this.testDifferentProgrammingLanguages();
        await this.testComplexCodeContexts();
        await this.testVariousPromptTypes();
        await this.testConfigurationScenarios();
        await this.testErrorRecovery();
    }
    async testTypicalUserWorkflow() {
        console.log('\n👤 Testing Typical User Workflow');
        console.log('-'.repeat(40));
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const cache = new cacheManager_1.CacheManager();
        // Scenario 1: User asks for help with a bug
        console.log('  Scenario 1: Bug fix request');
        let context = {
            originalPrompt: "I have a bug in my authentication function. Can you help me fix it? The user login is not working properly.",
            filePath: 'auth.ts',
            selection: 'function login(username, password)',
            editorSnapshot: `
        function login(username: string, password: string) {
          if (!username || !password) {
            return false;
          }
          // Bug: not checking password strength
          return validateCredentials(username, password);
        }
      `,
            timestamp: Date.now()
        };
        let variants = await enhancer.enhance(context);
        let scored = optimizer.scoreVariants(variants);
        console.log(`    Generated ${variants.length} variants`);
        console.log(`    Best score: ${scored[0].score}`);
        console.log(`    Token savings: ${optimizer.calculateTokenSavings(context.originalPrompt, scored[0].text)}%`);
        // Cache the result
        cache.put(context.originalPrompt, scored[0].text);
        // Scenario 2: User wants to create something new
        console.log('  Scenario 2: New feature request');
        context = {
            originalPrompt: "Please create a new React component for displaying user profiles with avatar, name, email, and status indicator.",
            filePath: 'UserProfile.tsx',
            editorSnapshot: `
        import React from 'react';
        
        interface User {
          id: string;
          name: string;
          email: string;
          avatar?: string;
          status: 'online' | 'offline' | 'away';
        }
      `,
            timestamp: Date.now()
        };
        variants = await enhancer.enhance(context);
        scored = optimizer.scoreVariants(variants);
        console.log(`    Generated ${variants.length} variants`);
        console.log(`    Best compression: ${scored[0].compressionRatio}%`);
        // Scenario 3: User asks similar question (cache hit)
        console.log('  Scenario 3: Similar question (testing cache)');
        const similarPrompt = "Help me fix a bug in the authentication logic. The login function isn't working.";
        const cached = cache.get(similarPrompt);
        const similar = cache.findSimilar(similarPrompt);
        console.log(`    Exact cache hit: ${cached ? 'Yes' : 'No'}`);
        console.log(`    Similar found: ${similar ? `Yes (${(similar.similarity * 100).toFixed(1)}% match)` : 'No'}`);
        console.log('✅ User workflow test completed');
    }
    async testDifferentProgrammingLanguages() {
        console.log('\n💻 Testing Different Programming Languages');
        console.log('-'.repeat(40));
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const scenarios = [
            {
                name: 'JavaScript/TypeScript',
                prompt: 'Create a function to validate email addresses',
                context: `
          interface ValidationResult {
            isValid: boolean;
            errors: string[];
          }
        `
            },
            {
                name: 'Python',
                prompt: 'Write a class for data processing',
                context: `
          class DataProcessor:
              def __init__(self):
                  self.data = []
        `
            },
            {
                name: 'Java',
                prompt: 'Implement a user service class',
                context: `
          public class UserService {
              private List<User> users;
              
              public UserService() {
                  this.users = new ArrayList<>();
              }
          }
        `
            },
            {
                name: 'C#',
                prompt: 'Create a repository pattern implementation',
                context: `
          public interface IRepository<T> {
              Task<T> GetByIdAsync(int id);
              Task<List<T>> GetAllAsync();
          }
        `
            },
            {
                name: 'Go',
                prompt: 'Write a HTTP handler function',
                context: `
          func handleRequest(w http.ResponseWriter, r *http.Request) {
              // Implementation here
          }
        `
            }
        ];
        for (const scenario of scenarios) {
            const context = {
                originalPrompt: scenario.prompt,
                editorSnapshot: scenario.context,
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const scored = optimizer.scoreVariants(variants);
            console.log(`  ${scenario.name}:`);
            console.log(`    Variants: ${variants.length}`);
            console.log(`    Context preserved: ${variants[0].meta?.slimmedContext ? 'Yes' : 'No'}`);
            console.log(`    Compression: ${scored[0].compressionRatio}%`);
            console.log(`    Score: ${scored[0].score}`);
        }
        console.log('✅ Multi-language test completed');
    }
    async testComplexCodeContexts() {
        console.log('\n🏗️ Testing Complex Code Contexts');
        console.log('-'.repeat(40));
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const complexScenarios = [
            {
                name: 'Large file with many imports',
                context: `
          import React, { useState, useEffect, useCallback, useMemo } from 'react';
          import { connect } from 'react-redux';
          import { bindActionCreators } from 'redux';
          import { debounce } from 'lodash';
          import { format } from 'date-fns';
          import axios from 'axios';
          
          // Many more imports...
          
          const UserComponent = ({ users, actions }) => {
            const [loading, setLoading] = useState(false);
            // Component implementation
          };
        `
            },
            {
                name: 'File with extensive comments',
                context: `
          /**
           * This is a comprehensive user management system
           * that handles user authentication, authorization,
           * and profile management.
           */
          
          // TODO: Add email verification
          // FIXME: Password validation is too weak
          // NOTE: This needs refactoring
          
          class UserManager {
            // Constructor with dependency injection
            constructor(database, logger) {
              // Initialize components
            }
          }
        `
            },
            {
                name: 'Mixed code with multiple classes',
                context: `
          class DatabaseConnection {
            connect() { /* implementation */ }
          }
          
          class UserRepository {
            constructor(db) { this.db = db; }
          }
          
          class UserService {
            constructor(repo) { this.repo = repo; }
          }
          
          // Utility functions
          function validateEmail(email) { return /.*@.*/.test(email); }
          function hashPassword(pwd) { return btoa(pwd); }
        `
            }
        ];
        for (const scenario of complexScenarios) {
            const context = {
                originalPrompt: 'Add error handling to the user validation logic',
                editorSnapshot: scenario.context,
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const slimmedContext = variants[0].meta?.slimmedContext || '';
            const originalSize = scenario.context.length;
            const slimmedSize = slimmedContext.length;
            const reduction = ((originalSize - slimmedSize) / originalSize) * 100;
            console.log(`  ${scenario.name}:`);
            console.log(`    Original size: ${originalSize} chars`);
            console.log(`    Slimmed size: ${slimmedSize} chars`);
            console.log(`    Size reduction: ${reduction.toFixed(1)}%`);
            console.log(`    Contains relevant code: ${slimmedContext.includes('User') ? 'Yes' : 'No'}`);
        }
        console.log('✅ Complex context test completed');
    }
    async testVariousPromptTypes() {
        console.log('\n📝 Testing Various Prompt Types');
        console.log('-'.repeat(40));
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const promptTypes = [
            {
                type: 'Question',
                prompt: 'How do I implement user authentication in Node.js?'
            },
            {
                type: 'Feature Request',
                prompt: 'Create a REST API endpoint for user registration with email validation'
            },
            {
                type: 'Bug Report',
                prompt: 'My React component is not re-rendering when the state changes. Can you help debug this?'
            },
            {
                type: 'Code Review',
                prompt: 'Please review this function and suggest improvements for performance and readability'
            },
            {
                type: 'Explanation',
                prompt: 'Explain how async/await works in JavaScript with examples'
            },
            {
                type: 'Refactoring',
                prompt: 'Refactor this legacy code to use modern ES6+ syntax and improve maintainability'
            },
            {
                type: 'Testing',
                prompt: 'Write comprehensive unit tests for this user service class'
            },
            {
                type: 'Documentation',
                prompt: 'Generate JSDoc documentation for all methods in this utility class'
            }
        ];
        for (const promptType of promptTypes) {
            const context = {
                originalPrompt: promptType.prompt,
                timestamp: Date.now()
            };
            const variants = await enhancer.enhance(context);
            const scored = optimizer.scoreVariants(variants);
            console.log(`  ${promptType.type}:`);
            console.log(`    Original: "${promptType.prompt.substring(0, 50)}..."`);
            console.log(`    Enhanced: "${scored[0].text.substring(0, 50)}..."`);
            console.log(`    Compression: ${scored[0].compressionRatio}%`);
            console.log(`    Score: ${scored[0].score}`);
        }
        console.log('✅ Prompt types test completed');
    }
    async testConfigurationScenarios() {
        console.log('\n⚙️ Testing Configuration Scenarios');
        console.log('-'.repeat(40));
        const testPrompt = "Can you please help me create a comprehensive function that validates user input data?";
        const context = {
            originalPrompt: testPrompt,
            timestamp: Date.now()
        };
        const configs = [
            { name: 'Conservative (Light)', compressionLevel: 'light', tokenSavingsTarget: 15 },
            { name: 'Balanced (Moderate)', compressionLevel: 'moderate', tokenSavingsTarget: 30 },
            { name: 'Aggressive', compressionLevel: 'aggressive', tokenSavingsTarget: 50 }
        ];
        for (const config of configs) {
            const enhancerConfig = {
                ...testConfig,
                compressionLevel: config.compressionLevel,
                tokenSavingsTarget: config.tokenSavingsTarget
            };
            const enhancer = new enhancerCore_1.EnhancerCore(enhancerConfig);
            const optimizer = new tokenOptimizer_1.TokenOptimizer(enhancerConfig);
            const variants = await enhancer.enhance(context);
            const scored = optimizer.scoreVariants(variants);
            const savings = optimizer.calculateTokenSavings(testPrompt, scored[0].text);
            console.log(`  ${config.name}:`);
            console.log(`    Variants generated: ${variants.length}`);
            console.log(`    Best compression: ${scored[0].compressionRatio}%`);
            console.log(`    Token savings: ${savings}%`);
            console.log(`    Meets target: ${savings >= config.tokenSavingsTarget ? 'Yes' : 'No'}`);
        }
        console.log('✅ Configuration scenarios test completed');
    }
    async testErrorRecovery() {
        console.log('\n🚨 Testing Error Recovery');
        console.log('-'.repeat(40));
        const enhancer = new enhancerCore_1.EnhancerCore(testConfig);
        const optimizer = new tokenOptimizer_1.TokenOptimizer(testConfig);
        const cache = new cacheManager_1.CacheManager();
        // Test various edge cases
        const edgeCases = [
            {
                name: 'Empty prompt',
                context: { originalPrompt: '', timestamp: Date.now() }
            },
            {
                name: 'Very long prompt',
                context: {
                    originalPrompt: 'x'.repeat(10000),
                    timestamp: Date.now()
                }
            },
            {
                name: 'Special characters',
                context: {
                    originalPrompt: 'Create function with émojis 🚀 and spécial chars @#$%^&*()',
                    timestamp: Date.now()
                }
            },
            {
                name: 'Malformed code context',
                context: {
                    originalPrompt: 'Fix this code',
                    editorSnapshot: 'function broken( { return undefined }',
                    timestamp: Date.now()
                }
            },
            {
                name: 'Null/undefined handling',
                context: {
                    originalPrompt: 'Test null handling',
                    selection: undefined,
                    editorSnapshot: null,
                    timestamp: Date.now()
                }
            }
        ];
        for (const testCase of edgeCases) {
            try {
                console.log(`  Testing: ${testCase.name}`);
                const variants = await enhancer.enhance(testCase.context);
                const scored = optimizer.scoreVariants(variants);
                // Should handle gracefully
                console.log(`    ✅ Handled gracefully (${variants.length} variants)`);
                // Test caching edge case
                cache.put(testCase.context.originalPrompt, scored[0]?.text || 'fallback');
                const cached = cache.get(testCase.context.originalPrompt);
                console.log(`    ✅ Caching works: ${cached ? 'Yes' : 'No'}`);
            }
            catch (error) {
                console.log(`    ❌ Error: ${error}`);
            }
        }
        console.log('✅ Error recovery test completed');
    }
}
exports.IntegrationTests = IntegrationTests;
// Run integration tests if this file is executed directly
if (require.main === module) {
    const integrationTests = new IntegrationTests();
    integrationTests.runIntegrationTests().catch(console.error);
}
//# sourceMappingURL=integration.test.js.map