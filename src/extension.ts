import { ExtensionContext } from "vscode";
import Formatter from "./formatter";

export function activate(context: ExtensionContext) {
    const formatter = new Formatter();
    formatter.init(context);
}

export function deactivate() { }
