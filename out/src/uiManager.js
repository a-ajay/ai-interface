"use strict";
/**
 * UI Module
 * Handles status bar, WebView preview, and dashboard components
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
exports.UIManager = void 0;
const vscode = __importStar(require("vscode"));
class UIManager {
    constructor(context) {
        this.state = {
            isProcessing: false,
            metrics: {
                totalPrompts: 0,
                totalTokensSaved: 0,
                averageCompressionRatio: 0,
                cacheHitRate: 0,
                averageResponseTime: 0,
                acceptanceRate: 0
            }
        };
        this.context = context;
        this.setupStatusBar();
    }
    /**
     * Initialize status bar item
     */
    setupStatusBar() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'aiOrchestrator.showDashboard';
        this.statusBarItem.tooltip = 'AI Interaction Orchestrator';
        this.updateStatusBar();
        this.statusBarItem.show();
        this.context.subscriptions.push(this.statusBarItem);
    }
    /**
     * Update status bar display
     */
    updateStatusBar() {
        const metrics = this.state.metrics;
        if (this.state.isProcessing) {
            this.statusBarItem.text = `$(sync~spin) AI Orchestrator`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            const savedTokens = this.state.metrics?.totalTokensSaved || 0;
            const compressionRatio = Math.round(this.state.metrics?.averageCompressionRatio || 0);
            this.statusBarItem.text = `$(zap) AI Orchestrator (${savedTokens} tokens saved, ${compressionRatio}% compression)`;
            this.statusBarItem.backgroundColor = undefined;
        }
    }
    /**
     * Show prompt preview dialog with variants
     */
    async showPromptPreview(originalPrompt, variants) {
        if (variants.length === 0)
            return null;
        // Create webview panel for preview
        const panel = vscode.window.createWebviewPanel('promptPreview', 'AI Orchestrator - Prompt Preview', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        // Set up webview content
        panel.webview.html = this.getPreviewWebviewContent(originalPrompt, variants);
        // Handle messages from webview
        return new Promise((resolve) => {
            panel.webview.onDidReceiveMessage((message) => {
                switch (message.command) {
                    case 'selectVariant':
                        const selectedVariant = variants.find(v => v.id === message.variantId);
                        panel.dispose();
                        resolve(selectedVariant || null);
                        break;
                    case 'cancel':
                        panel.dispose();
                        resolve(null);
                        break;
                    case 'useOriginal':
                        panel.dispose();
                        resolve({
                            id: 'original',
                            text: originalPrompt,
                            estimatedTokens: 0,
                            score: 0
                        });
                        break;
                }
            }, undefined, this.context.subscriptions);
            panel.onDidDispose(() => {
                resolve(null);
            });
        });
    }
    /**
     * Generate HTML content for preview webview
     */
    getPreviewWebviewContent(originalPrompt, variants) {
        const bestVariant = variants[0]; // Assuming sorted by score
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        
        .header {
            margin-bottom: 30px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 20px;
        }
        
        .comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .prompt-box {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            background-color: var(--vscode-input-background);
        }
        
        .prompt-box h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
        }
        
        .prompt-text {
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
            background-color: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 4px;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .metrics {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        
        .metric {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        
        .variants {
            margin-bottom: 30px;
        }
        
        .variant {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        .variant:hover {
            border-color: var(--vscode-focusBorder);
        }
        
        .variant.best {
            border-color: var(--vscode-charts-green);
            background-color: var(--vscode-inputValidation-infoBackground);
        }
        
        .variant-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .variant-title {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .variant-score {
            background-color: var(--vscode-charts-blue);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 20px;
        }
        
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .diff-indicator {
            color: var(--vscode-charts-red);
            font-weight: bold;
        }
        
        .improvement-indicator {
            color: var(--vscode-charts-green);
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🤖 Prompt Enhancement Preview</h2>
        <p>Choose the enhanced prompt variant that best matches your needs:</p>
    </div>
    
    <div class="comparison">
        <div class="prompt-box">
            <h3>📝 Original Prompt</h3>
            <div class="prompt-text">${this.escapeHtml(originalPrompt)}</div>
            <div class="metrics">
                <span class="metric">Length: ${originalPrompt.length} chars</span>
            </div>
        </div>
        
        <div class="prompt-box">
            <h3>⚡ Best Enhanced Variant</h3>
            <div class="prompt-text">${this.escapeHtml(bestVariant.text)}</div>
            <div class="metrics">
                <span class="metric">Length: ${bestVariant.text.length} chars</span>
                <span class="metric improvement-indicator">-${bestVariant.compressionRatio || 0}% tokens</span>
                <span class="metric">Score: ${bestVariant.score || 0}</span>
                ${bestVariant.estimatedTokens ? `<span class="metric">~${bestVariant.estimatedTokens} tokens</span>` : ''}
            </div>
        </div>
    </div>
    
    <div class="variants">
        <h3>🎯 Available Variants</h3>
        ${variants.map((variant, index) => `
            <div class="variant ${index === 0 ? 'best' : ''}" onclick="selectVariant('${variant.id}')">
                <div class="variant-header">
                    <span class="variant-title">
                        ${index === 0 ? '🏆 ' : ''}Variant ${index + 1}
                        ${variant.meta?.variant ? ` (${variant.meta.variant})` : ''}
                    </span>
                    <span class="variant-score">Score: ${variant.score || 0}</span>
                </div>
                <div class="prompt-text">${this.escapeHtml(variant.text.substring(0, 200))}${variant.text.length > 200 ? '...' : ''}</div>
                <div class="metrics">
                    <span class="metric">Length: ${variant.text.length}</span>
                    ${variant.compressionRatio ? `<span class="metric">Compression: ${variant.compressionRatio}%</span>` : ''}
                    ${variant.estimatedTokens ? `<span class="metric">Tokens: ~${variant.estimatedTokens}</span>` : ''}
                    ${variant.transformations ? `<span class="metric">Transforms: ${variant.transformations.join(', ')}</span>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="actions">
        <button class="btn" onclick="selectVariant('${bestVariant.id}')">
            ✨ Use Best Variant
        </button>
        <button class="btn secondary" onclick="useOriginal()">
            📝 Use Original
        </button>
        <button class="btn secondary" onclick="cancel()">
            ❌ Cancel
        </button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function selectVariant(variantId) {
            vscode.postMessage({
                command: 'selectVariant',
                variantId: variantId
            });
        }
        
        function useOriginal() {
            vscode.postMessage({
                command: 'useOriginal'
            });
        }
        
        function cancel() {
            vscode.postMessage({
                command: 'cancel'
            });
        }
    </script>
</body>
</html>`;
    }
    /**
     * Show dashboard webview
     */
    showDashboard() {
        if (this.currentWebviewPanel) {
            this.currentWebviewPanel.reveal();
            return;
        }
        this.currentWebviewPanel = vscode.window.createWebviewPanel('aiOrchestratorDashboard', 'AI Orchestrator Dashboard', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.currentWebviewPanel.webview.html = this.getDashboardWebviewContent();
        this.currentWebviewPanel.onDidDispose(() => {
            this.currentWebviewPanel = undefined;
        });
        // Handle messages from dashboard
        this.currentWebviewPanel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'clearCache':
                    vscode.commands.executeCommand('aiOrchestrator.clearCache');
                    break;
                case 'refresh':
                    this.updateDashboard();
                    break;
            }
        }, undefined, this.context.subscriptions);
    }
    /**
     * Generate dashboard HTML content
     */
    getDashboardWebviewContent() {
        const metrics = this.state.metrics || {
            totalPrompts: 0,
            totalTokensSaved: 0,
            averageCompressionRatio: 0,
            cacheHitRate: 0,
            averageResponseTime: 0,
            acceptanceRate: 0
        };
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Orchestrator Dashboard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 20px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: var(--vscode-charts-blue);
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        
        .actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 30px;
        }
        
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .performance-chart {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .chart-placeholder {
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI Interaction Orchestrator</h1>
        <p>Performance metrics and configuration dashboard</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${metrics.totalPrompts}</div>
            <div class="stat-label">Total Prompts Enhanced</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${metrics.totalTokensSaved}</div>
            <div class="stat-label">Tokens Saved</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${Math.round(metrics.averageCompressionRatio)}%</div>
            <div class="stat-label">Average Compression</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${Math.round(metrics.cacheHitRate * 100)}%</div>
            <div class="stat-label">Cache Hit Rate</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${Math.round(metrics.averageResponseTime)}ms</div>
            <div class="stat-label">Avg Response Time</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${Math.round(metrics.acceptanceRate * 100)}%</div>
            <div class="stat-label">Enhancement Acceptance</div>
        </div>
    </div>
    
    <div class="actions">
        <button class="btn" onclick="refresh()">🔄 Refresh Data</button>
        <button class="btn" onclick="clearCache()">🗑️ Clear Cache</button>
        <button class="btn" onclick="openSettings()">⚙️ Settings</button>
    </div>
    
    <div class="performance-chart">
        <h3>📊 Performance Trends</h3>
        <div class="chart-placeholder">
            Performance chart will be implemented in future versions
        </div>
    </div>
    
    <div style="text-align: center; color: var(--vscode-descriptionForeground); font-size: 0.8em; margin-top: 40px;">
        AI Interaction Orchestrator v0.1.0 | Built with ❤️ for developers
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }
        
        function clearCache() {
            vscode.postMessage({ command: 'clearCache' });
        }
        
        function openSettings() {
            // Will be implemented to open VS Code settings
        }
    </script>
</body>
</html>`;
    }
    /**
     * Show progress notification during processing
     */
    showProgress(operation, progress) {
        this.state.isProcessing = true;
        this.state.currentOperation = operation;
        this.updateStatusBar();
        // For chunked operations, show progress notification
        if (progress) {
            return vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `AI Orchestrator: ${operation}`,
                cancellable: true
            }, async (progressReporter, token) => {
                progressReporter.report({ increment: 0 });
                return new Promise((resolve) => {
                    // This will be called externally to update progress
                    this.context.subscriptions.push(token.onCancellationRequested(() => {
                        resolve();
                    }));
                });
            });
        }
        return null;
    }
    /**
     * Hide progress and update status
     */
    hideProgress() {
        this.state.isProcessing = false;
        this.state.currentOperation = undefined;
        this.updateStatusBar();
    }
    /**
     * Update metrics and refresh UI
     */
    updateMetrics(newMetrics) {
        this.state.metrics = {
            totalPrompts: newMetrics.totalPrompts ?? this.state.metrics?.totalPrompts ?? 0,
            totalTokensSaved: newMetrics.totalTokensSaved ?? this.state.metrics?.totalTokensSaved ?? 0,
            averageCompressionRatio: newMetrics.averageCompressionRatio ?? this.state.metrics?.averageCompressionRatio ?? 0,
            cacheHitRate: newMetrics.cacheHitRate ?? this.state.metrics?.cacheHitRate ?? 0,
            averageResponseTime: newMetrics.averageResponseTime ?? this.state.metrics?.averageResponseTime ?? 0,
            acceptanceRate: newMetrics.acceptanceRate ?? this.state.metrics?.acceptanceRate ?? 0
        };
        this.updateStatusBar();
        this.updateDashboard();
    }
    /**
     * Update dashboard if it's open
     */
    updateDashboard() {
        if (this.currentWebviewPanel) {
            this.currentWebviewPanel.webview.html = this.getDashboardWebviewContent();
        }
    }
    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        switch (type) {
            case 'info':
                vscode.window.showInformationMessage(`AI Orchestrator: ${message}`);
                break;
            case 'warning':
                vscode.window.showWarningMessage(`AI Orchestrator: ${message}`);
                break;
            case 'error':
                vscode.window.showErrorMessage(`AI Orchestrator: ${message}`);
                break;
        }
    }
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    /**
     * Dispose of all UI resources
     */
    dispose() {
        this.statusBarItem.dispose();
        if (this.currentWebviewPanel) {
            this.currentWebviewPanel.dispose();
        }
    }
}
exports.UIManager = UIManager;
//# sourceMappingURL=uiManager.js.map