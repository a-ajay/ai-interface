/**
 * PromptIntercept Module
 * Intercepts user prompts and extracts context from VS Code editor
 */
import * as vscode from 'vscode';
import { PromptContext, OrchestratorEvent } from './types';
export declare class PromptIntercept {
    private context;
    private disposables;
    private eventEmitter;
    private lastPrompt;
    private lastContext;
    readonly onEvent: vscode.Event<OrchestratorEvent>;
    constructor(context: vscode.ExtensionContext);
    private setupEventListeners;
    /**
     * Extract prompt context from current editor state
     */
    extractPromptContext(userPrompt?: string): PromptContext;
    /**
     * Get contextual code around the cursor/selection
     */
    private getEditorSnapshot;
    /**
     * Detect current user from VS Code environment
     */
    private getUserId;
    /**
     * Handle text selection changes
     */
    private handleSelectionChange;
    /**
     * Handle active editor changes
     */
    private handleActiveEditorChange;
    /**
     * Handle document changes
     */
    private handleDocumentChange;
    /**
     * Heuristic to determine if text looks like a prompt
     */
    private looksLikePrompt;
    /**
     * Manually set a prompt (useful for command palette integration)
     */
    setPrompt(prompt: string): PromptContext;
    /**
     * Get the last captured prompt context
     */
    getLastContext(): PromptContext | null;
    /**
     * Listen for Copilot Chat inputs (if extension is available)
     */
    private setupCopilotIntegration;
    /**
     * Emit an event
     */
    private emitEvent;
    /**
     * Show input box for manual prompt entry
     */
    promptUser(): Promise<PromptContext | null>;
    /**
     * Get context from clipboard (useful for external prompts)
     */
    getClipboardContext(): Promise<PromptContext | null>;
    /**
     * Dispose of all listeners
     */
    dispose(): void;
}
//# sourceMappingURL=promptIntercept.d.ts.map