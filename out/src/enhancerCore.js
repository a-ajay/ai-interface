"use strict";
/**
 * EnhancerCore Module
 * Performs context slimming, prompt compression, and enhancement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancerCore = void 0;
const uuid_1 = require("uuid");
class EnhancerCore {
    constructor(config) {
        this.compressionRules = [];
        this.config = config;
        this.initializeCompressionRules();
    }
    /**
     * Main enhancement method - produces enhanced prompt variants
     */
    async enhance(context) {
        const variants = [];
        // Create baseline enhanced prompt
        const slimmedContext = this.slimContext(context);
        const compressed = this.compressPrompt(context.originalPrompt);
        const baseVariant = {
            id: (0, uuid_1.v4)(),
            text: this.combinePromptWithContext(compressed, slimmedContext),
            meta: {
                slimmedContext,
                originalLength: context.originalPrompt.length,
                compressedLength: compressed.length
            },
            compressionRatio: this.calculateCompressionRatio(context.originalPrompt, compressed),
            transformations: ['context-slimming', 'compression']
        };
        variants.push(baseVariant);
        // Create additional variants based on compression level
        if (this.config.compressionLevel !== 'light') {
            variants.push(await this.createAggressiveVariant(context, slimmedContext));
        }
        if (this.config.compressionLevel === 'aggressive') {
            variants.push(await this.createMinimalVariant(context, slimmedContext));
        }
        return variants;
    }
    /**
     * Context Slimming - Remove unnecessary context while preserving semantics
     */
    slimContext(context) {
        if (!context.editorSnapshot) {
            return '';
        }
        const snapshot = context.editorSnapshot;
        // 1. Basic trimming
        let trimmed = this.removeComments(snapshot);
        // 2. Remove long import blocks (keep only referenced ones)
        trimmed = this.removeUnusedImports(trimmed, context.originalPrompt);
        // 3. Score lines by relevance and keep top N
        const lines = trimmed.split('\n');
        const scoredLines = lines.map(line => ({
            line,
            score: this.calculateLineRelevance(line, context.originalPrompt)
        }));
        // Sort by relevance and keep top lines
        const maxLines = this.getMaxContextLines();
        const topLines = scoredLines
            .sort((a, b) => b.score - a.score)
            .slice(0, maxLines)
            .map(item => item.line);
        return topLines.join('\n');
    }
    /**
     * Remove comments unless they're relevant to the prompt
     */
    removeComments(code) {
        const lines = code.split('\n');
        return lines.map(line => {
            // Keep TODO, FIXME, and other important comments
            if (/^\s*\/\/\s*(TODO|FIXME|BUG|HACK|NOTE)/i.test(line)) {
                return line;
            }
            // Keep JSDoc comments
            if (/^\s*\/\*\*/.test(line)) {
                return line;
            }
            // Remove regular comments
            return line.replace(/^\s*\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
        }).join('\n');
    }
    /**
     * Remove imports that aren't referenced in the prompt
     */
    removeUnusedImports(code, prompt) {
        const lines = code.split('\n');
        const importLines = [];
        const otherLines = [];
        lines.forEach(line => {
            if (/^import\s+/.test(line.trim()) || /^from\s+.+\s+import/.test(line.trim())) {
                importLines.push(line);
            }
            else {
                otherLines.push(line);
            }
        });
        // Filter imports - keep only those referenced in prompt or code
        const referencedImports = importLines.filter(importLine => {
            const imported = this.extractImportedNames(importLine);
            return imported.some(name => prompt.includes(name) ||
                otherLines.some(line => line.includes(name)));
        });
        return [...referencedImports, ...otherLines].join('\n');
    }
    /**
     * Extract imported names from an import statement
     */
    extractImportedNames(importLine) {
        const names = [];
        // Handle various import patterns
        const patterns = [
            /import\s+(\w+)/g, // import Something
            /import\s+{\s*([^}]+)\s*}/g, // import { a, b, c }
            /from\s+.+\s+import\s+(\w+)/g, // from x import y
            /from\s+.+\s+import\s+{\s*([^}]+)\s*}/g // from x import { a, b }
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(importLine)) !== null) {
                const captured = match[1];
                if (captured.includes(',')) {
                    names.push(...captured.split(',').map(n => n.trim()));
                }
                else {
                    names.push(captured.trim());
                }
            }
        });
        return names;
    }
    /**
     * Calculate relevance score for a line of code
     */
    calculateLineRelevance(line, prompt) {
        let score = 0;
        // Basic token intersection
        const lineTokens = this.tokenize(line.toLowerCase());
        const promptTokens = this.tokenize(prompt.toLowerCase());
        const intersection = lineTokens.filter(token => promptTokens.includes(token));
        score += intersection.length * 2;
        // Bonus for function/class definitions
        if (/^\s*(function|class|def|const|let|var)\s+\w+/i.test(line)) {
            score += 5;
        }
        // Bonus for lines with identifiers mentioned in prompt
        const identifiers = prompt.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        identifiers.forEach(id => {
            if (line.includes(id)) {
                score += 3;
            }
        });
        // Penalty for very long lines
        if (line.length > 120) {
            score -= 2;
        }
        // Penalty for empty or whitespace-only lines
        if (line.trim().length === 0) {
            score = 0;
        }
        return score;
    }
    /**
     * Simple tokenization for relevance calculation
     */
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2);
    }
    /**
     * Prompt compression using rule-based patterns
     */
    compressPrompt(prompt) {
        let compressed = prompt;
        // Apply compression rules based on level
        this.compressionRules.forEach(rule => {
            if (typeof rule.pattern === 'string') {
                compressed = compressed.replace(new RegExp(rule.pattern, 'gi'), rule.replacement);
            }
            else {
                compressed = compressed.replace(rule.pattern, rule.replacement);
            }
        });
        // Normalize whitespace
        compressed = compressed.replace(/\s+/g, ' ').trim();
        return compressed;
    }
    /**
     * Initialize compression rules based on config
     */
    initializeCompressionRules() {
        // Base rules (always applied)
        this.compressionRules = [
            {
                pattern: /\bcan you please\b/gi,
                replacement: '',
                description: 'Remove polite prefixes'
            },
            {
                pattern: /\bplease\b(?!\s+note)/gi,
                replacement: '',
                description: 'Remove please (except "please note")'
            },
            {
                pattern: /\bI want (a|an)\b/gi,
                replacement: '',
                description: 'Remove "I want a/an"'
            },
            {
                pattern: /\bthat will\b/gi,
                replacement: '',
                description: 'Remove "that will"'
            },
            {
                pattern: /\bI need (a|an)?\b/gi,
                replacement: '',
                description: 'Remove "I need"'
            }
        ];
        // Add moderate compression rules
        if (this.config.compressionLevel !== 'light') {
            this.compressionRules.push({
                pattern: /\bI would like (to|a|an)?\b/gi,
                replacement: '',
                description: 'Remove "I would like"'
            }, {
                pattern: /\bcould you\b/gi,
                replacement: '',
                description: 'Remove "could you"'
            }, {
                pattern: /\bhelp me (to|with)?\b/gi,
                replacement: '',
                description: 'Remove "help me"'
            });
        }
        // Add aggressive compression rules
        if (this.config.compressionLevel === 'aggressive') {
            this.compressionRules.push({
                pattern: /\ba function that takes\b/gi,
                replacement: 'function(',
                description: 'Compress function descriptions'
            }, {
                pattern: /\band returns?\b/gi,
                replacement: '→',
                description: 'Use arrow for returns'
            }, {
                pattern: /\bgenerate\s+(a|an)\s+/gi,
                replacement: 'create ',
                description: 'Shorten generate to create'
            });
        }
    }
    /**
     * Create aggressive compression variant
     */
    async createAggressiveVariant(context, slimmedContext) {
        // More aggressive compression
        let aggressive = context.originalPrompt;
        // Additional aggressive patterns
        aggressive = aggressive
            .replace(/\bwrite\s+code\s+that\b/gi, 'code:')
            .replace(/\bcreate\s+a\s+function\s+that\b/gi, 'func:')
            .replace(/\bimplement\s+a\s+method\s+that\b/gi, 'method:')
            .replace(/\bfor\s+example\b/gi, 'e.g.')
            .replace(/\bsuch\s+as\b/gi, 'e.g.');
        // Apply base compression
        aggressive = this.compressPrompt(aggressive);
        return {
            id: (0, uuid_1.v4)(),
            text: this.combinePromptWithContext(aggressive, slimmedContext),
            meta: {
                slimmedContext,
                originalLength: context.originalPrompt.length,
                compressedLength: aggressive.length,
                variant: 'aggressive'
            },
            compressionRatio: this.calculateCompressionRatio(context.originalPrompt, aggressive),
            transformations: ['context-slimming', 'aggressive-compression']
        };
    }
    /**
     * Create minimal variant (extreme compression)
     */
    async createMinimalVariant(context, slimmedContext) {
        let minimal = context.originalPrompt;
        // Extract key components
        const action = this.extractAction(minimal);
        const subject = this.extractSubject(minimal);
        const constraints = this.extractConstraints(minimal);
        // Rebuild minimally
        minimal = `${action} ${subject}${constraints ? ` (${constraints})` : ''}`;
        return {
            id: (0, uuid_1.v4)(),
            text: this.combinePromptWithContext(minimal, slimmedContext),
            meta: {
                slimmedContext,
                originalLength: context.originalPrompt.length,
                compressedLength: minimal.length,
                variant: 'minimal'
            },
            compressionRatio: this.calculateCompressionRatio(context.originalPrompt, minimal),
            transformations: ['context-slimming', 'minimal-compression']
        };
    }
    /**
     * Extract action from prompt
     */
    extractAction(prompt) {
        const actions = ['create', 'generate', 'write', 'build', 'implement', 'fix', 'refactor', 'analyze', 'explain'];
        const found = actions.find(action => prompt.toLowerCase().includes(action));
        return found || 'create';
    }
    /**
     * Extract subject from prompt
     */
    extractSubject(prompt) {
        // Simple heuristic to find the main subject
        const words = prompt.split(/\s+/);
        const subjects = ['function', 'class', 'method', 'component', 'algorithm', 'script', 'program'];
        for (let i = 0; i < words.length; i++) {
            const word = words[i].toLowerCase();
            if (subjects.includes(word)) {
                // Include the next few words as they might be descriptive
                return words.slice(i, i + 3).join(' ');
            }
        }
        return 'code';
    }
    /**
     * Extract constraints from prompt
     */
    extractConstraints(prompt) {
        const constraints = [];
        // Look for language hints
        const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'rust', 'go'];
        languages.forEach(lang => {
            if (prompt.toLowerCase().includes(lang)) {
                constraints.push(lang);
            }
        });
        // Look for framework hints
        const frameworks = ['react', 'vue', 'angular', 'nodejs', 'express', 'fastapi'];
        frameworks.forEach(fw => {
            if (prompt.toLowerCase().includes(fw)) {
                constraints.push(fw);
            }
        });
        return constraints.join(', ');
    }
    /**
     * Combine prompt with context
     */
    combinePromptWithContext(prompt, context) {
        if (!context.trim()) {
            return prompt;
        }
        return `Context:\n\`\`\`\n${context}\n\`\`\`\n\nTask: ${prompt}`;
    }
    /**
     * Calculate compression ratio
     */
    calculateCompressionRatio(original, compressed) {
        if (original.length === 0)
            return 0;
        return Math.round(((original.length - compressed.length) / original.length) * 100);
    }
    /**
     * Get maximum context lines based on config
     */
    getMaxContextLines() {
        switch (this.config.compressionLevel) {
            case 'light': return 20;
            case 'moderate': return 15;
            case 'aggressive': return 10;
            default: return 15;
        }
    }
    /**
     * Update compression rules (for hot-swapping)
     */
    updateCompressionRules(newRules) {
        this.compressionRules = [...newRules];
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.initializeCompressionRules();
    }
}
exports.EnhancerCore = EnhancerCore;
//# sourceMappingURL=enhancerCore.js.map