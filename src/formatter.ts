import {
    commands,
    ExtensionContext,
    workspace,
    window as vsWindow,
    OutputChannel,
    TextDocument,
    languages,
    Range,
    WorkspaceConfiguration,
    ConfigurationTarget,
} from "vscode";

export default class Formatter {
    private readonly FORMAT_DOCUMENT_ACTION = "editor.action.formatDocument";
    private readonly FORMAT_SELECTION_ACTION = "editor.action.formatSelection";
    private readonly OUTPUT_CHANNEL_NAME = "Multi Formatter";

    private formatAction: string;
    private formatters: string[];
    private logger: OutputChannel;

    private defaultFormatter: string | null | undefined;
    private config: WorkspaceConfiguration = {} as WorkspaceConfiguration;
    private isFormatting: boolean = false;

    constructor() {
        this.logger = vsWindow.createOutputChannel(this.OUTPUT_CHANNEL_NAME);

        this.formatAction = this.FORMAT_DOCUMENT_ACTION;
        this.formatters = [];
    }

    init(context: ExtensionContext) {
        this.logger.appendLine(`Registering actions and formatter`);
        context.subscriptions.push(
            commands.registerCommand("multiFormatter.formatSelection", this.formatSelection.bind(this)),
            commands.registerCommand("multiFormatter.formatDocument", this.formatDocument.bind(this)),
            languages.registerDocumentRangeFormattingEditProvider('*', {
                provideDocumentRangeFormattingEdits: this.selectFormattingAction.bind(this),
            }),
        );
    }

    selectFormattingAction(document: TextDocument, range: Range) {
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        const fullRange = new Range(firstLine.range.start, lastLine.range.end);

        if (range.isEmpty || range.isEqual(fullRange)) {
            this.formatDocument();
        } else {
            this.formatSelection();
        }

        return [];
    }

    async formatSelection() {
        this.formatAction = this.FORMAT_SELECTION_ACTION;
        await this.format();
    }

    async formatDocument() {
        this.formatAction = this.FORMAT_DOCUMENT_ACTION;
        await this.format();
    }

    private async format() {
        if (this.isFormatting) {
            this.logger.appendLine("We cannot format again while formatting");
            return;
        }

        this.isFormatting = true;
        await this.runFormatters();
        this.isFormatting = false;
    }

    getFormattersForCurrentDocument() {
        const document = vsWindow.activeTextEditor?.document;
        if (!document) {
            this.logger.appendLine(`There is no document to get the language from`);
            throw new Error("There is no document to get the language from");
        }

        // Some formatters don't work if the document is not directly active, so we activate it here
        vsWindow.showTextDocument(document);

        this.config = workspace.getConfiguration("editor", document);
        if (!this.config) {
            this.logger.appendLine(`There is no config we can update`);
            throw new Error("There is no config we can update");
        }

        this.defaultFormatter = this.config.get<string | null>("defaultFormatter");

        const extensionConfig = workspace.getConfiguration("multiFormatter", document);
        this.formatters = extensionConfig.get<string[]>("formatterList", []);
        if (
            this.formatters.length === 0 &&
            this.defaultFormatter &&
            this.defaultFormatter !== "Jota0222.multi-formatter"
        ) {
            this.logger.appendLine(`Added the default formatter ${this.defaultFormatter} to the list`);
            this.formatters.push(this.defaultFormatter);
        }
    }

    /**
     * @description This function returns the configuration target to overwrite the `editor.defaultFormatter` in the
     *   location that it currently exists, so we don't unexpectedly change other targets where the users have their
     *   `defaultFormatter` set.
     *
     *   The order of checks goes from the most specific to least specific location.
     */
    getCurrentConfigurationTarget(): { configurationTarget: ConfigurationTarget; isLanguageSpecific: boolean } {
        // "?? {}" handles the case where no config was found
        const {
            workspaceFolderLanguageValue,
            workspaceFolderValue,
            workspaceLanguageValue,
            workspaceValue,
            globalLanguageValue,
        } = this.config.inspect<string | null>("defaultFormatter") ?? {};

        if (workspaceFolderLanguageValue !== undefined || workspaceFolderValue !== undefined) {
            return {
                configurationTarget: ConfigurationTarget.WorkspaceFolder,
                isLanguageSpecific: workspaceFolderLanguageValue !== undefined,
            };
        }

        if (workspaceLanguageValue !== undefined || workspaceValue !== undefined) {
            return {
                configurationTarget: ConfigurationTarget.Workspace,
                isLanguageSpecific: workspaceLanguageValue !== undefined,
            };
        }

        return {
            configurationTarget: ConfigurationTarget.Global,
            isLanguageSpecific: globalLanguageValue !== undefined,
        };
    }

    async runFormatters() {
        this.getFormattersForCurrentDocument();

        const { configurationTarget, isLanguageSpecific } = this.getCurrentConfigurationTarget();

        for (const formatter of this.formatters) {
            this.logger.appendLine(`Executing ${this.formatAction} with ${formatter}`);

            await this.config.update("defaultFormatter", formatter, configurationTarget, isLanguageSpecific);
            await commands.executeCommand(this.formatAction);
        }

        if (this.config.get<boolean>("formatOnSave")) {
            this.logger.appendLine("Saving after formatting on save");
            await commands.executeCommand("workbench.action.files.saveWithoutFormatting");
        }

        // Return back to the original configuration
        await this.config.update("defaultFormatter", this.defaultFormatter, configurationTarget, isLanguageSpecific);
    }
}
