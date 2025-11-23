"use strict";
/**
 * Mock VS Code API for testing
 * This provides minimal implementations of VS Code APIs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.ExtensionMode = exports.StatusBarAlignment = exports.ViewColumn = exports.workspace = exports.commands = exports.window = void 0;
// Mock implementations
class MockStatusBarItem {
    constructor() {
        this.text = '';
    }
    show() { }
    hide() { }
}
class MockWebviewPanel {
    constructor() {
        this.webview = { html: '' };
    }
    reveal() { }
    dispose() { }
}
exports.window = {
    showInformationMessage: (message) => Promise.resolve(),
    showErrorMessage: (message) => Promise.resolve(),
    showWarningMessage: (message) => Promise.resolve(),
    createStatusBarItem: () => new MockStatusBarItem(),
    createWebviewPanel: (viewType, title, showOptions, options) => new MockWebviewPanel(),
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
    }
};
exports.commands = {
    registerCommand: (command, callback) => ({
        dispose: () => { }
    }),
    executeCommand: (command, ...args) => Promise.resolve()
};
exports.workspace = {
    getConfiguration: (section) => ({
        get: (key, defaultValue) => defaultValue,
        update: (key, value) => Promise.resolve()
    })
};
exports.ViewColumn = {
    One: 1,
    Two: 2,
    Three: 3
};
exports.StatusBarAlignment = {
    Left: 1,
    Right: 2
};
exports.ExtensionMode = {
    Development: 1,
    Test: 2,
    Production: 3
};
exports.env = {
    machineId: 'test-machine',
    sessionId: 'test-session'
};
//# sourceMappingURL=vscode-mock.js.map