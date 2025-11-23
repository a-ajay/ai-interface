/**
 * Main Extension Entry Point
 * AI Interaction Orchestrator for VS Code
 */
import * as vscode from 'vscode';
export declare class AIOrchestrator {
    private context;
    private promptIntercept;
    private enhancerCore;
    private tokenOptimizer;
    private cacheManager;
    private uiManager;
    private config;
    private disposables;
    constructor(context: vscode.ExtensionContext);
    /**
     * Load configuration from VS Code settings
     */
    private loadConfiguration;
    /**
     * Initialize all components
     */
    private setupComponents;
    /**
     * Register VS Code commands
     */
    private registerCommands;
    /**
     * Handle the main enhance prompt command (Ctrl+Shift+E)
     */
    private handleEnhancePrompt;
    /**
     * Handle enhancement of selected text
     */
    private handleEnhanceSelection;
    /**
     * Core enhancement and preview workflow
     */
    private enhanceAndShowPreview;
    /**
     * Show cached result to user
     */
    private showCachedResult;
    /**
     * Handle user's selected variant
     */
    private handleSelectedVariant;
    /**
     * Replace current selection with enhanced text
     */
    private replaceSelection;
    /**
     * Insert text at current cursor position
     */
    private insertTextAtCursor;
    /**
     * Open text in new document
     */
    private openInNewDocument;
    /**
     * Update metrics after enhancement
     */
    private updateMetrics;
    /**
     * Handle prompt intercept events
     */
    private handlePromptEvent;
    /**
     * Toggle extension enabled state
     */
    private toggleExtension;
    /**
     * Update configuration when settings change
     */
    private updateConfiguration;
    /**
     * Dispose all resources
     */
    dispose(): void;
}
export declare function activate(context: vscode.ExtensionContext): void;
export declare function deactivate(): void;
//# sourceMappingURL=extension.d.ts.map