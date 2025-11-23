/**
 * Mock VS Code API for testing
 * This provides minimal implementations of VS Code APIs
 */
export interface Range {
    start: {
        line: number;
        character: number;
    };
    end: {
        line: number;
        character: number;
    };
}
export interface Selection extends Range {
    isEmpty: boolean;
    anchor: {
        line: number;
        character: number;
    };
    active: {
        line: number;
        character: number;
    };
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
declare class MockStatusBarItem implements StatusBarItem {
    text: string;
    show(): void;
    hide(): void;
}
declare class MockWebviewPanel implements WebviewPanel {
    webview: {
        html: string;
    };
    reveal(): void;
    dispose(): void;
}
export declare const window: {
    showInformationMessage: (message: string) => Promise<void>;
    showErrorMessage: (message: string) => Promise<void>;
    showWarningMessage: (message: string) => Promise<void>;
    createStatusBarItem: () => MockStatusBarItem;
    createWebviewPanel: (viewType: string, title: string, showOptions: any, options?: any) => MockWebviewPanel;
    activeTextEditor: TextEditor;
};
export declare const commands: {
    registerCommand: (command: string, callback: Function) => {
        dispose: () => void;
    };
    executeCommand: (command: string, ...args: any[]) => Promise<void>;
};
export declare const workspace: {
    getConfiguration: (section?: string) => {
        get: (key: string, defaultValue?: any) => any;
        update: (key: string, value: any) => Promise<void>;
    };
};
export declare const ViewColumn: {
    One: number;
    Two: number;
    Three: number;
};
export declare const StatusBarAlignment: {
    Left: number;
    Right: number;
};
export declare const ExtensionMode: {
    Development: number;
    Test: number;
    Production: number;
};
export declare const env: {
    machineId: string;
    sessionId: string;
};
export {};
//# sourceMappingURL=vscode-mock.d.ts.map