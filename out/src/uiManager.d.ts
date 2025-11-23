/**
 * UI Module
 * Handles status bar, WebView preview, and dashboard components
 */
import * as vscode from 'vscode';
import { EnhancedPrompt, Metrics } from './types';
export declare class UIManager {
    private statusBarItem;
    private currentWebviewPanel;
    private context;
    private state;
    constructor(context: vscode.ExtensionContext);
    /**
     * Initialize status bar item
     */
    private setupStatusBar;
    /**
     * Update status bar display
     */
    private updateStatusBar;
    /**
     * Show prompt preview dialog with variants
     */
    showPromptPreview(originalPrompt: string, variants: EnhancedPrompt[]): Promise<EnhancedPrompt | null>;
    /**
     * Generate HTML content for preview webview
     */
    private getPreviewWebviewContent;
    /**
     * Show dashboard webview
     */
    showDashboard(): void;
    /**
     * Generate dashboard HTML content
     */
    private getDashboardWebviewContent;
    /**
     * Show progress notification during processing
     */
    showProgress(operation: string, progress?: {
        current: number;
        total: number;
    }): vscode.Progress<{
        message?: string;
        increment?: number;
    }> | null;
    /**
     * Hide progress and update status
     */
    hideProgress(): void;
    /**
     * Update metrics and refresh UI
     */
    updateMetrics(newMetrics: Partial<Metrics>): void;
    /**
     * Update dashboard if it's open
     */
    private updateDashboard;
    /**
     * Show notification message
     */
    showNotification(message: string, type?: 'info' | 'warning' | 'error'): void;
    /**
     * Escape HTML for safe display
     */
    private escapeHtml;
    /**
     * Dispose of all UI resources
     */
    dispose(): void;
}
//# sourceMappingURL=uiManager.d.ts.map