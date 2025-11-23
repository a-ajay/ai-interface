/**
 * PromptIntercept Module
 * Intercepts user prompts and extracts context from VS Code editor
 */

import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { PromptContext, OrchestratorEvent } from './types';

export class PromptIntercept {
  private disposables: vscode.Disposable[] = [];
  private eventEmitter = new vscode.EventEmitter<OrchestratorEvent>();
  private lastPrompt: string = '';
  private lastContext: PromptContext | null = null;

  public readonly onEvent = this.eventEmitter.event;

  constructor(private context: vscode.ExtensionContext) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for text selection changes to capture potential prompts
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        this.handleSelectionChange(event);
      })
    );

    // Listen for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.handleActiveEditorChange(editor);
      })
    );

    // Listen for document changes to update context
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.handleDocumentChange(event);
      })
    );
  }

  /**
   * Extract prompt context from current editor state
   */
  public extractPromptContext(userPrompt?: string): PromptContext {
    const editor = vscode.window.activeTextEditor;
    const context: PromptContext = {
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
  private getEditorSnapshot(editor: vscode.TextEditor): string {
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
  private getUserId(): string | undefined {
    // Try to get user info from VS Code settings or Git config
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (gitExtension?.isActive) {
        // Could potentially access Git user info
        // For now, return undefined and let it be anonymous
      }
    } catch (error) {
      // Silently fail
    }
    
    return undefined;
  }

  /**
   * Handle text selection changes
   */
  private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
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
  private handleActiveEditorChange(editor: vscode.TextEditor | undefined): void {
    if (editor) {
      // Update context when switching files
      this.lastContext = this.extractPromptContext();
    }
  }

  /**
   * Handle document changes
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
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
  private looksLikePrompt(text: string): boolean {
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
  public setPrompt(prompt: string): PromptContext {
    this.lastPrompt = prompt;
    this.lastContext = this.extractPromptContext(prompt);
    return this.lastContext;
  }

  /**
   * Get the last captured prompt context
   */
  public getLastContext(): PromptContext | null {
    return this.lastContext;
  }

  /**
   * Listen for Copilot Chat inputs (if extension is available)
   */
  private async setupCopilotIntegration(): Promise<void> {
    try {
      // Check if GitHub Copilot extension is available
      const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
      const copilotChatExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
      
      if (copilotChatExtension?.isActive) {
        // Try to hook into Copilot Chat API if available
        // This would require access to their internal APIs
        console.log('GitHub Copilot Chat detected - integration capabilities limited');
      }
    } catch (error) {
      console.log('Copilot integration setup failed:', error);
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(type: OrchestratorEvent['type'], data: any): void {
    this.eventEmitter.fire({
      type,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Show input box for manual prompt entry
   */
  public async promptUser(): Promise<PromptContext | null> {
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
  public async getClipboardContext(): Promise<PromptContext | null> {
    try {
      const clipboardText = await vscode.env.clipboard.readText();
      if (clipboardText && this.looksLikePrompt(clipboardText)) {
        return this.setPrompt(clipboardText);
      }
    } catch (error) {
      console.log('Failed to read clipboard:', error);
    }
    
    return null;
  }

  /**
   * Dispose of all listeners
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.eventEmitter.dispose();
  }
}