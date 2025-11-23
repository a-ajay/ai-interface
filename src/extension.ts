/**
 * Main Extension Entry Point
 * AI Interaction Orchestrator for VS Code
 */

import * as vscode from 'vscode';
import { PromptIntercept } from './promptIntercept';
import { EnhancerCore } from './enhancerCore';
import { TokenOptimizer } from './tokenOptimizer';
import { CacheManager } from './cacheManager';
import { UIManager } from './uiManager';
import { OrchestratorConfig, ExtensionState, PromptContext, EnhancedPrompt } from './types';

export class AIOrchestrator {
  private promptIntercept!: PromptIntercept;
  private enhancerCore!: EnhancerCore;
  private tokenOptimizer!: TokenOptimizer;
  private cacheManager!: CacheManager;
  private uiManager!: UIManager;
  private config: OrchestratorConfig;
  private disposables: vscode.Disposable[] = [];

  constructor(private context: vscode.ExtensionContext) {
    this.config = this.loadConfiguration();
    this.setupComponents();
    this.registerCommands();
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfiguration(): OrchestratorConfig {
    const config = vscode.workspace.getConfiguration('aiOrchestrator');
    
    return {
      enabled: config.get('enabled', true),
      compressionLevel: config.get('compressionLevel', 'moderate'),
      tokenSavingsTarget: config.get('tokenSavingsTarget', 30),
      enableWebSync: config.get('enableWebSync', false),
      cacheTimeout: config.get('cacheTimeout', 30),
      chunkThreshold: 2000,
      maxConcurrentChunks: 3
    };
  }

  /**
   * Initialize all components
   */
  private setupComponents(): void {
    this.promptIntercept = new PromptIntercept(this.context);
    this.enhancerCore = new EnhancerCore(this.config);
    this.tokenOptimizer = new TokenOptimizer(this.config);
    this.cacheManager = new CacheManager({
      maxEntries: 200,
      ttlMinutes: this.config.cacheTimeout,
      similarityThreshold: 0.8
    });
    this.uiManager = new UIManager(this.context);

    // Listen to configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('aiOrchestrator')) {
          this.updateConfiguration();
        }
      })
    );

    // Listen to prompt intercept events
    this.disposables.push(
      this.promptIntercept.onEvent((event) => {
        this.handlePromptEvent(event);
      })
    );
  }

  /**
   * Register VS Code commands
   */
  private registerCommands(): void {
    // Main enhancement command (Ctrl+Shift+E)
    this.disposables.push(
      vscode.commands.registerCommand('aiOrchestrator.enhancePrompt', async () => {
        await this.handleEnhancePrompt();
      })
    );

    // Show dashboard
    this.disposables.push(
      vscode.commands.registerCommand('aiOrchestrator.showDashboard', () => {
        this.uiManager.showDashboard();
      })
    );

    // Clear cache
    this.disposables.push(
      vscode.commands.registerCommand('aiOrchestrator.clearCache', () => {
        this.cacheManager.clear();
        this.uiManager.showNotification('Cache cleared successfully', 'info');
      })
    );

    // Force enhancement of selected text
    this.disposables.push(
      vscode.commands.registerCommand('aiOrchestrator.enhanceSelection', async () => {
        await this.handleEnhanceSelection();
      })
    );

    // Toggle extension enable/disable
    this.disposables.push(
      vscode.commands.registerCommand('aiOrchestrator.toggle', async () => {
        await this.toggleExtension();
      })
    );
  }

  /**
   * Handle the main enhance prompt command (Ctrl+Shift+E)
   */
  private async handleEnhancePrompt(): Promise<void> {
    if (!this.config.enabled) {
      this.uiManager.showNotification('AI Orchestrator is disabled', 'warning');
      return;
    }

    try {
      // Get current context
      let context = this.promptIntercept.getLastContext();
      
      // If no context, prompt user or get from selection
      if (!context) {
        const editor = vscode.window.activeTextEditor;
        if (editor && !editor.selection.isEmpty) {
          const selectedText = editor.document.getText(editor.selection);
          context = this.promptIntercept.setPrompt(selectedText);
        } else {
          context = await this.promptIntercept.promptUser();
        }
      }

      if (!context) {
        this.uiManager.showNotification('No prompt to enhance', 'info');
        return;
      }

      await this.enhanceAndShowPreview(context);
    } catch (error) {
      console.error('Error in handleEnhancePrompt:', error);
      this.uiManager.showNotification(`Enhancement failed: ${error}`, 'error');
    }
  }

  /**
   * Handle enhancement of selected text
   */
  private async handleEnhanceSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      this.uiManager.showNotification('No text selected', 'warning');
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const context = this.promptIntercept.setPrompt(selectedText);
    
    await this.enhanceAndShowPreview(context);
  }

  /**
   * Core enhancement and preview workflow
   */
  private async enhanceAndShowPreview(context: PromptContext): Promise<void> {
    // Check cache first
    const cached = this.cacheManager.get(context.originalPrompt);
    if (cached) {
      this.uiManager.showNotification('Using cached enhancement', 'info');
      await this.showCachedResult(cached);
      return;
    }

    // Check for similar cached entries
    const similar = this.cacheManager.findSimilar(context.originalPrompt);
    if (similar && similar.similarity > 0.9) {
      const useCached = await vscode.window.showQuickPick(
        ['Use cached result', 'Generate new enhancement'],
        {
          placeHolder: `Found similar cached result (${Math.round(similar.similarity * 100)}% match). Use it?`
        }
      );
      
      if (useCached === 'Use cached result') {
        await this.showCachedResult(similar.entry.response);
        return;
      }
    }

    // Show progress
    this.uiManager.showProgress('Enhancing prompt...');

    try {
      // Enhance the prompt
      const variants = await this.enhancerCore.enhance(context);
      
      // Score and optimize variants
      const scoredVariants = this.tokenOptimizer.scoreVariants(variants);
      
      // Hide progress
      this.uiManager.hideProgress();
      
      // Show preview and let user choose
      const selectedVariant = await this.uiManager.showPromptPreview(
        context.originalPrompt,
        scoredVariants
      );
      
      if (selectedVariant) {
        // Cache the result
        this.cacheManager.put(
          context.originalPrompt,
          selectedVariant.text,
          {
            tokensSaved: this.tokenOptimizer.calculateTokenSavings(
              context.originalPrompt,
              selectedVariant.text
            ),
            compressionRatio: selectedVariant.compressionRatio
          }
        );
        
        // Update metrics
        this.updateMetrics(context, selectedVariant);
        
        // Copy to clipboard or insert into editor
        await this.handleSelectedVariant(selectedVariant);
      }
    } catch (error) {
      this.uiManager.hideProgress();
      throw error;
    }
  }

  /**
   * Show cached result to user
   */
  private async showCachedResult(cachedText: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      'Found cached enhancement',
      'Use it',
      'Copy to clipboard',
      'Show in new document'
    );
    
    switch (action) {
      case 'Use it':
        await this.insertTextAtCursor(cachedText);
        break;
      case 'Copy to clipboard':
        await vscode.env.clipboard.writeText(cachedText);
        this.uiManager.showNotification('Enhanced prompt copied to clipboard', 'info');
        break;
      case 'Show in new document':
        await this.openInNewDocument(cachedText);
        break;
    }
  }

  /**
   * Handle user's selected variant
   */
  private async handleSelectedVariant(variant: EnhancedPrompt): Promise<void> {
    const action = await vscode.window.showQuickPick(
      [
        'Copy to clipboard',
        'Replace selection',
        'Insert at cursor',
        'Open in new document'
      ],
      {
        placeHolder: 'What would you like to do with the enhanced prompt?'
      }
    );

    switch (action) {
      case 'Copy to clipboard':
        await vscode.env.clipboard.writeText(variant.text);
        this.uiManager.showNotification('Enhanced prompt copied to clipboard', 'info');
        break;
      
      case 'Replace selection':
        await this.replaceSelection(variant.text);
        break;
      
      case 'Insert at cursor':
        await this.insertTextAtCursor(variant.text);
        break;
      
      case 'Open in new document':
        await this.openInNewDocument(variant.text);
        break;
    }
  }

  /**
   * Replace current selection with enhanced text
   */
  private async replaceSelection(text: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit(editBuilder => {
        if (!editor.selection.isEmpty) {
          editBuilder.replace(editor.selection, text);
        } else {
          editBuilder.insert(editor.selection.active, text);
        }
      });
    }
  }

  /**
   * Insert text at current cursor position
   */
  private async insertTextAtCursor(text: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, text);
      });
    }
  }

  /**
   * Open text in new document
   */
  private async openInNewDocument(text: string): Promise<void> {
    const document = await vscode.workspace.openTextDocument({
      content: text,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(document);
  }

  /**
   * Update metrics after enhancement
   */
  private updateMetrics(context: PromptContext, variant: EnhancedPrompt): void {
    const tokensSaved = this.tokenOptimizer.calculateTokenSavings(
      context.originalPrompt,
      variant.text
    );
    
    // This is a simplified metrics update
    // In a real implementation, you'd track these over time
    this.uiManager.updateMetrics({
      totalPrompts: 1, // This should be incremental
      totalTokensSaved: tokensSaved,
      averageCompressionRatio: variant.compressionRatio || 0,
      acceptanceRate: 1 // User accepted this variant
    });
  }

  /**
   * Handle prompt intercept events
   */
  private async handlePromptEvent(event: any): Promise<void> {
    // Handle various prompt events
    switch (event.type) {
      case 'prompt-detected':
        // Could auto-enhance if configured
        break;
      case 'context-changed':
        // Update context as needed
        break;
    }
  }

  /**
   * Toggle extension enabled state
   */
  private async toggleExtension(): Promise<void> {
    const config = vscode.workspace.getConfiguration('aiOrchestrator');
    const currentState = config.get('enabled', true);
    
    await config.update('enabled', !currentState, vscode.ConfigurationTarget.Global);
    
    this.uiManager.showNotification(
      `AI Orchestrator ${!currentState ? 'enabled' : 'disabled'}`,
      'info'
    );
  }

  /**
   * Update configuration when settings change
   */
  private updateConfiguration(): void {
    this.config = this.loadConfiguration();
    
    // Update components with new config
    this.enhancerCore.updateConfig(this.config);
    this.tokenOptimizer.updateConfig(this.config);
    this.cacheManager.updateOptions({
      ttlMinutes: this.config.cacheTimeout
    });
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.promptIntercept.dispose();
    this.uiManager.dispose();
  }
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
  console.log('AI Interaction Orchestrator is now active');
  
  const orchestrator = new AIOrchestrator(context);
  
  context.subscriptions.push(orchestrator);
  
  // Show welcome message on first activation
  const isFirstActivation = !context.globalState.get('aiOrchestrator.hasActivated');
  if (isFirstActivation) {
    vscode.window.showInformationMessage(
      'AI Interaction Orchestrator activated! Use Ctrl+Shift+E to enhance prompts.',
      'Show Dashboard'
    ).then(action => {
      if (action === 'Show Dashboard') {
        vscode.commands.executeCommand('aiOrchestrator.showDashboard');
      }
    });
    
    context.globalState.update('aiOrchestrator.hasActivated', true);
  }
}

// Extension deactivation
export function deactivate() {
  console.log('AI Interaction Orchestrator is now deactivated');
}