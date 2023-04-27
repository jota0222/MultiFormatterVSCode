import { ExtensionContext, TextDocument, workspace } from "vscode";
import Formatter from "./formatter";

export function activate(context: ExtensionContext) {
    const formatter = new Formatter();
    formatter.init(context);

    addOnSaveTextDocumentListeners(formatter, context);
}

function addOnSaveTextDocumentListeners(formatter: Formatter, _context: ExtensionContext) {
    workspace.onDidSaveTextDocument((document: TextDocument) => {
        if (!formatter.hasRan()) {
            formatter.setRun(true);
            formatter.onDidSaveTextDocument(document);
        }
    });
}

export function deactivate() { }
