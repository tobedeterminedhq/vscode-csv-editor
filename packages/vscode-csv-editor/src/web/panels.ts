import {
    CancellationToken,
    CustomTextEditorProvider,
    Disposable,
    env,
    ExtensionContext,
    Range,
    TextDocument,
    Uri,
    ViewColumn,
    Webview,
    WebviewPanel,
    window,
    workspace, WorkspaceEdit,
} from "vscode";

/**
 * Provider for cat scratch editors.
 *
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 *
 * This provider demonstrates:
 *
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class CatScratchEditorProvider implements CustomTextEditorProvider {

    public static register(context: ExtensionContext): Disposable {
        const provider = new CatScratchEditorProvider(context);
        return window.registerCustomEditorProvider(CatScratchEditorProvider.viewType, provider);
    }

    private static readonly viewType = 'vscode-csv-editor.csvEditor';

    private static readonly scratchCharacters = ['😸', '😹', '😺', '😻', '😼', '😽', '😾', '🙀', '😿', '🐱'];

    constructor(
        private readonly context: ExtensionContext
    ) { }

    /**
     * Called when our custom editor is opened.
     *
     *
     */
    public async resolveCustomTextEditor(
        document: TextDocument,
        webviewPanel: WebviewPanel,
        _token: CancellationToken
    ): Promise<void> {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview, this.context);

        function updateWebview() {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText(),
            });
        }

        // Hook up event handlers so that we can synchronize the webview with the text document.
        //
        // The text document acts as our model, so we have to sync change in the document to our
        // editor and sync changes in the editor back to the document.
        //
        // Remember that a single text document can also be shared between multiple custom
        // editors (this happens for example when you split a custom editor)

        const changeDocumentSubscription = workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Receive message from the webview.
        webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'add':
                    this.addNewScratch(document);
                    return;

                case 'delete':
                    this.deleteScratch(document, e.id);
                    return;
            }
        });

        updateWebview();
    }

    /**
     * Get the static html used for the editor webviews.
     */
    // Came from the extension example
    private getHtmlForWebview(webview: Webview): string {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(Uri.joinPath(
            this.context.extensionUri, 'media', 'catScratch.js'));

        const styleResetUri = webview.asWebviewUri(Uri.joinPath(
            this.context.extensionUri, 'media', 'reset.css'));

        const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(
            this.context.extensionUri, 'media', 'vscode.css'));

        const styleMainUri = webview.asWebviewUri(Uri.joinPath(
            this.context.extensionUri, 'media', 'catScratch.css'));

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!--				<link href="${styleResetUri}" rel="stylesheet" />-->
<!--				<link href="${styleVSCodeUri}" rel="stylesheet" />-->
<!--				<link href="${styleMainUri}" rel="stylesheet" />-->
				<title>Cat Scratch</title>
			</head>
			<body>
				<div class="notes">
					<div class="add-button">
						<button>Scratch!</button>
					</div>
				</div>
				<div> hello!</div>
				
<!--				<script nonce="${nonce}" src="${scriptUri}"></script>-->
			</body>
			</html>`;
    }

    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the React webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: Webview, context: ExtensionContext) {
        const extensionUri = context.extensionUri;
        const stylesUri = getUri(webview, extensionUri, ["src", "web", "webuiOutput", "assets", "index.css"]);
        const scriptUri = getUri(webview, extensionUri, ["src", "web", "webuiOutput", "assets", "index.js"]);

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Theme Tokens</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }

    /**
     * Add a new scratch to the current document.
     */
    private addNewScratch(document: TextDocument) {
        const json = this.getDocumentAsJson(document);
        const character = CatScratchEditorProvider.scratchCharacters[Math.floor(Math.random() * CatScratchEditorProvider.scratchCharacters.length)];
        json.scratches = [
            ...(Array.isArray(json.scratches) ? json.scratches : []),
            {
                id: getNonce(),
                text: character,
                created: Date.now(),
            }
        ];

        return this.updateTextDocument(document, json);
    }

    /**
     * Delete an existing scratch from a document.
     */
    private deleteScratch(document: TextDocument, id: string) {
        const json = this.getDocumentAsJson(document);
        if (!Array.isArray(json.scratches)) {
            return;
        }

        json.scratches = json.scratches.filter((note: any) => note.id !== id);

        return this.updateTextDocument(document, json);
    }

    /**
     * Try to get a current document as json text.
     */
    private getDocumentAsJson(document: TextDocument): any {
        const text = document.getText();
        if (text.trim().length === 0) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            throw new Error('Could not get document as json. Content is not valid json');
        }
    }

    /**
     * Write out the json to a given document.
     */
    private updateTextDocument(document: TextDocument, json: any) {
        const edit = new WorkspaceEdit();

        // Just replace the entire document every time for this example extension.
        // A more complete extension should compute minimal edits instead.
        edit.replace(
            document.uri,
            new Range(0, 0, document.lineCount, 0),
            JSON.stringify(json, null, 2));

        return workspace.applyEdit(edit);
    }
}

export class Panel {
    public static currentPanel: Panel | undefined;
    private readonly _panel: WebviewPanel;
    private _disposables: Disposable[] = [];

    /**
     * The HelloWorldPanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    private constructor(panel: WebviewPanel, context: ExtensionContext) {
        this._panel = panel;

        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(this.dispose, null, this._disposables);

        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, context);

        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
    }

    public static triggerUpdate() {
        if (Panel.currentPanel) {
            Panel.currentPanel._panel.webview.postMessage({
                command: "updateTheme",
            });
        }
    }

    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    public static render(context: ExtensionContext) {
        if (Panel.currentPanel) {
            // If the webview panel already exists reveal it
            Panel.currentPanel._panel.reveal(ViewColumn.One);
        } else {
            // If a webview panel does not already exist create and show a new one
            const panel = window.createWebviewPanel(
                // Panel view type
                "tokensPanel",
                // Panel title
                "Spectrum 🌈",
                // The editor column the panel should be displayed in
                ViewColumn.One,
                // Extra panel configurations
                {
                    // Enable JavaScript in the webview
                    enableScripts: true,
                }
            );

            Panel.currentPanel = new Panel(panel, context);
        }
    }

    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    public dispose() {
        Panel.currentPanel = undefined;

        // Dispose of the current webview panel
        this._panel.dispose();

        // Dispose of all disposables (i.e. commands) for the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the React webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: Webview, context: ExtensionContext) {
        const extensionUri = context.extensionUri;
        const stylesUri = getUri(webview, extensionUri, ["webuiOutput", "build", "assets", "index.css"]);
        const scriptUri = getUri(webview, extensionUri, ["webuiOutput", "build", "assets", "index.js"]);

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Theme Tokens</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }

    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    private _setWebviewMessageListener(webview: Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                const command = message.command;
                const payload = message.payload;

                switch (command) {
                    case "copyThemeVariable":
                        const quickPickOptions = [`var(${payload.name})`, payload.name, payload.value].map(
                            (option) => `Copy: ${option}`
                        );
                        const result = await window.showQuickPick(quickPickOptions, {
                            placeHolder: "Select a variable to copy",
                        });
                        if (result) {
                            const trimmedResult = result.replace("Copy: ", "");
                            await env.clipboard.writeText(trimmedResult);
                            await window.showInformationMessage(`Copied ${trimmedResult} to clipboard.`);
                        }
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }
}

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}