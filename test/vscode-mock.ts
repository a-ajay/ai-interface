/**
 * Mock VS Code API for testing
 * This provides minimal implementations of VS Code APIs
 */

export interface Range {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

export interface Selection extends Range {
  isEmpty: boolean;
  anchor: { line: number; character: number };
  active: { line: number; character: number };
}

export interface TextDocument {
  fileName: string;
  getText(range?: Range): string;
  languageId: string;
  lineCount: number;
}

export interface TextEditor {
  document: TextDocument;
  selection: Selection;
  selections: Selection[];
}

export interface StatusBarItem {
  text: string;
  show(): void;
  hide(): void;
}

export interface WebviewPanel {
  webview: {
    html: string;
  };
  reveal(): void;
  dispose(): void;
}

export interface ExtensionContext {
  extensionPath: string;
  subscriptions: any[];
}

// Mock implementations
class MockStatusBarItem implements StatusBarItem {
  text = '';
  show() {}
  hide() {}
}

class MockWebviewPanel implements WebviewPanel {
  webview = { html: '' };
  reveal() {}
  dispose() {}
}

export const window = {
  showInformationMessage: (message: string) => Promise.resolve(),
  showErrorMessage: (message: string) => Promise.resolve(),
  showWarningMessage: (message: string) => Promise.resolve(),
  
  createStatusBarItem: () => new MockStatusBarItem(),
  
  createWebviewPanel: (
    viewType: string,
    title: string,
    showOptions: any,
    options?: any
  ) => new MockWebviewPanel(),
  
  activeTextEditor: {
    document: {
      fileName: 'test.ts',
      getText: () => 'test code',
      languageId: 'typescript',
      lineCount: 10
    },
    selection: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
      isEmpty: true,
      anchor: { line: 0, character: 0 },
      active: { line: 0, character: 0 }
    },
    selections: []
  } as TextEditor
};

export const commands = {
  registerCommand: (command: string, callback: Function) => ({
    dispose: () => {}
  }),
  
  executeCommand: (command: string, ...args: any[]) => Promise.resolve()
};

export const workspace = {
  getConfiguration: (section?: string) => ({
    get: (key: string, defaultValue?: any) => defaultValue,
    update: (key: string, value: any) => Promise.resolve()
  })
};

export const ViewColumn = {
  One: 1,
  Two: 2,
  Three: 3
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
};

export const ExtensionMode = {
  Development: 1,
  Test: 2,
  Production: 3
};

export const env = {
  machineId: 'test-machine',
  sessionId: 'test-session'
};