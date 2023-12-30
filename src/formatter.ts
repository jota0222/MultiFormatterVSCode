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
    ConfigurationTarget
} from "vscode";
import supportedLanguages from "./supported-languages";

export default class Formatter {
    private readonly FORMAT_DOCUMENT_ACTION = 'editor.action.formatDocument';
    private readonly FORMAT_SELECTION_ACTION = 'editor.action.formatSelection';
    private readonly OUTPUT_CHANNEL_NAME = 'Multi Formatter';

    private formatAction: string;
    private formatters: string[];
    private logger: OutputChannel;

    private defaultFormatter: string | undefined;
    private config: WorkspaceConfiguration = {} as WorkspaceConfiguration;


    constructor() {
        this.logger = vsWindow.createOutputChannel(this.OUTPUT_CHANNEL_NAME);
        
        this.formatAction = this.FORMAT_DOCUMENT_ACTION;
        this.formatters = [];
    }

    init(context: ExtensionContext) {
        this.logger.appendLine(`Registering actions and formatter for supported languages`);
        context.subscriptions.push(
            commands.registerCommand('multiFormatter.formatSelection', this.formatSelection.bind(this)),
            commands.registerCommand('multiFormatter.formatDocument', this.formatDocument.bind(this)),
            languages.registerDocumentRangeFormattingEditProvider(supportedLanguages, {
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
        await this.format()
    }

    async formatDocument() {
        this.formatAction = this.FORMAT_DOCUMENT_ACTION;
        await this.format();
    }

    private async format() {
        this.getFormattersForCurrentDocument();
        try {
            await this.runFormatters();
        } catch (error) {
            if (error instanceof Error && error.name === 'CodeExpectedError') {
                return await this.runFormatters(ConfigurationTarget.Global)
            }
            throw error;
        }
    }

    getFormattersForCurrentDocument() {
        const document = vsWindow.activeTextEditor?.document;
        if (!document) {
            this.logger.appendLine(`There is no document to get the language from`);
            throw new Error('There is no document to get the language from');
        }

        // Some formatters don't work if the document is not directly active, so we active it here
        vsWindow.showTextDocument(document);

        this.config = workspace.getConfiguration('editor', document);
        if (!this.config) {
            this.logger.appendLine(`There is no config we can update`);
            throw new Error('There is no config we can update');
        }

        this.defaultFormatter = this.config.get<string>('defaultFormatter');

        const extensionConfig = workspace.getConfiguration('multiFormatter', document);
        this.formatters = extensionConfig.get<string[]>('formatterList', []);
        if (this.formatters.length === 0
            && this.defaultFormatter
            && this.defaultFormatter !== 'Jota0222.multi-formatter'
        ) {
            this.logger.appendLine(`Added the default formatter ${this.defaultFormatter} to the list`);
            this.formatters.push(this.defaultFormatter);
        }
    }

    async runFormatters(configurationTarget: ConfigurationTarget = ConfigurationTarget.Workspace) {
        for (const formatter of this.formatters) {
            this.logger.appendLine(`Executing ${this.formatAction} with ${formatter}`);

            await this.config.update('defaultFormatter', formatter, configurationTarget, true);
            await commands.executeCommand(this.formatAction);
        }

        if (this.config.get<boolean>('formatOnSave')) {
            await commands.executeCommand('workbench.action.files.save');
        }

        // Return back to the original configuration
        await this.config.update('defaultFormatter', this.defaultFormatter, configurationTarget, true);
    }
};
