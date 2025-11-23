"use strict";
/**
 * PromptIntercept Module
 * Intercepts user prompts and extracts context from VS Code editor
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptIntercept = void 0;
const vscode = __importStar(require("vscode"));
class PromptIntercept {
    constructor(context) {
        this.context = context;
        this.disposables = [];
        this.eventEmitter = new vscode.EventEmitter();
        this.lastPrompt = '';
        this.lastContext = null;
        this.onEvent = this.eventEmitter.event;
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Listen for text selection changes to capture potential prompts
        this.disposables.push(vscode.window.onDidChangeTextEditorSelection((event) => {
            this.handleSelectionChange(event);
        }));
        // Listen for active editor changes
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
            this.handleActiveEditorChange(editor);
        }));
        // Listen for document changes to update context
        this.disposables.push(vscode.workspace.onDidChangeTextDocument((event) => {
            this.handleDocumentChange(event);
        }));
    }
    /**
     * Extract prompt context from current editor state
     */
    extractPromptContext(userPrompt) {
        const editor = vscode.window.activeTextEditor;
        const context = {
            originalPrompt: userPrompt || this.lastPrompt,
            timestamp: Date.now()
        };
        if (editor) {
            context.filePath = editor.document.uri.fsPath;
            // Get selected text if any
            const selection = editor.selection;
            if (!selection.isEmpty) {
                context.selection = editor.document.getText(selection);
            }
            // Get editor snapshot (context around cursor/selection)
            context.editorSnapshot = this.getEditorSnapshot(editor);
        }
        // Try to detect user ID from VS Code settings or environment
        context.userId = this.getUserId();
        return context;
    }
    /**
     * Get contextual code around the cursor/selection
     */
    getEditorSnapshot(editor) {
        const document = editor.document;
        const position = editor.selection.active;
        // Get lines around cursor (configurable range)
        const contextLines = 10; // TODO: make this configurable
        const startLine = Math.max(0, position.line - contextLines);
        const endLine = Math.min(document.lineCount - 1, position.line + contextLines);
        const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        return document.getText(range);
    }
    /**
     * Detect current user from VS Code environment
     */
    getUserId() {
        // Try to get user info from VS Code settings or Git config
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension?.isActive) {
                // Could potentially access Git user info
                // For now, return undefined and let it be anonymous
            }
        }
        catch (error) {
            // Silently fail
        }
        return undefined;
    }
    /**
     * Handle text selection changes
     */
    handleSelectionChange(event) {
        const editor = event.textEditor;
        const selection = event.selections[0];
        if (selection && !selection.isEmpty) {
            const selectedText = editor.document.getText(selection);
            // Check if this looks like a prompt (heuristic)
            if (this.looksLikePrompt(selectedText)) {
                this.lastPrompt = selectedText;
                this.lastContext = this.extractPromptContext(selectedText);
            }
        }
    }
    /**
     * Handle active editor changes
     */
    handleActiveEditorChange(editor) {
        if (editor) {
            // Update context when switching files
            this.lastContext = this.extractPromptContext();
        }
    }
    /**
     * Handle document changes
     */
    handleDocumentChange(event) {
        // Update snapshot when document changes
        if (vscode.window.activeTextEditor?.document === event.document) {
            // Debounce this to avoid excessive updates
            setTimeout(() => {
                this.lastContext = this.extractPromptContext();
            }, 500);
        }
    }
    /**
     * Heuristic to determine if text looks like a prompt
     */
    looksLikePrompt(text) {
        // Basic heuristics for prompt detection
        const promptIndicators = [
            /^(create|generate|write|build|implement|fix|refactor|explain|analyze)/i,
            /^(can you|could you|please|help me|i need|i want)/i,
            /\b(function|class|component|method|algorithm)\b/i,
            /\b(bug|error|issue|problem)\b/i
        ];
        const hasPromptKeywords = promptIndicators.some(pattern => pattern.test(text));
        const isReasonableLength = text.length > 10 && text.length < 2000;
        const hasQuestionMarks = (text.match(/\?/g) || []).length > 0;
        return hasPromptKeywords && isReasonableLength || hasQuestionMarks;
    }
    /**
     * Manually set a prompt (useful for command palette integration)
     */
    setPrompt(prompt) {
        this.lastPrompt = prompt;
        this.lastContext = this.extractPromptContext(prompt);
        return this.lastContext;
    }
    /**
     * Get the last captured prompt context
     */
    getLastContext() {
        return this.lastContext;
    }
    /**
     * Listen for Copilot Chat inputs (if extension is available)
     */
    async setupCopilotIntegration() {
        try {
            // Check if GitHub Copilot extension is available
            const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
            const copilotChatExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
            if (copilotChatExtension?.isActive) {
                // Try to hook into Copilot Chat API if available
                // This would require access to their internal APIs
                console.log('GitHub Copilot Chat detected - integration capabilities limited');
            }
        }
        catch (error) {
            console.log('Copilot integration setup failed:', error);
        }
    }
    /**
     * Emit an event
     */
    emitEvent(type, data) {
        this.eventEmitter.fire({
            type,
            data,
            timestamp: Date.now()
        });
    }
    /**
     * Show input box for manual prompt entry
     */
    async promptUser() {
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter your prompt for AI enhancement',
            placeHolder: 'e.g., Create a function that validates email addresses...',
            ignoreFocusOut: true
        });
        if (userInput) {
            return this.setPrompt(userInput);
        }
        return null;
    }
    /**
     * Get context from clipboard (useful for external prompts)
     */
    async getClipboardContext() {
        try {
            const clipboardText = await vscode.env.clipboard.readText();
            if (clipboardText && this.looksLikePrompt(clipboardText)) {
                return this.setPrompt(clipboardText);
            }
        }
        catch (error) {
            console.log('Failed to read clipboard:', error);
        }
        return null;
    }
    /**
     * Dispose of all listeners
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.eventEmitter.dispose();
    }
}
exports.PromptIntercept = PromptIntercept;
//# sourceMappingURL=promptIntercept.js.map