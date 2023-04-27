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

export default class Formatter {
    private readonly FORMAT_DOCUMENT_ACTION = 'editor.action.formatDocument';
    private readonly FORMAT_SELECTION_ACTION = 'editor.action.formatSelection';
    private readonly OUTPUT_CHANNEL_NAME = 'MultiFormat';
    private readonly CONFIG_NAMESPACE = 'multi-format';
    private readonly LANGUAGES_KEY_NAME = 'languages';
    private readonly FORMATTERS_KEY_NAME = 'formatters';
    private readonly DEFAULT_FORMATTER_KEY_NAME = 'defaultFormatter';

    private formatAction: string;
    private languages: string[];
    private formatters: string[];
    private ran: boolean;
    private logger: OutputChannel;

    private defaultFormatter: string | undefined;
    private config: WorkspaceConfiguration = {} as WorkspaceConfiguration;

    constructor() {
        this.logger = vsWindow.createOutputChannel(this.OUTPUT_CHANNEL_NAME);

        this.formatAction = this.FORMAT_DOCUMENT_ACTION;
        this.languages = [];
        this.formatters = [];
        this.ran = false;
    }

    init(context: ExtensionContext) {
        context.subscriptions.push(
            commands.registerCommand('multiFormat.formatSelection', this.formatSelection.bind(this)),
            commands.registerCommand('multiFormat.formatDocument', this.formatDocument.bind(this)),
        );

        const configuration = workspace.getConfiguration(this.CONFIG_NAMESPACE);
        // All provided languages are valid picks
        this.languages = configuration.get<string[]>(this.LANGUAGES_KEY_NAME, []);

        this.logger.appendLine(`Registering formatter for known languages`);
        languages.registerDocumentRangeFormattingEditProvider(this.languages, {
            provideDocumentRangeFormattingEdits: this.selectFormattingAction.bind(this),
        });
    }

    hasRan() {
        return this.ran;
    }

    setRun(run: boolean) {
        this.ran = run;
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

    async onDidSaveTextDocument(_document: TextDocument) {
        this.formatAction = this.FORMAT_DOCUMENT_ACTION;
        await this.format();
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
        await this.runFormatters();
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

        this.defaultFormatter = this.config.get<string>(this.DEFAULT_FORMATTER_KEY_NAME);

        const extensionConfig = workspace.getConfiguration(this.CONFIG_NAMESPACE, document);
        const formatters = extensionConfig.get<string[]>(this.FORMATTERS_KEY_NAME, []);
        this.formatters = formatters;
    }

    async runFormatters() {
        for (const formatter of this.formatters) {
            this.logger.appendLine(`Executing ${this.formatAction} with ${formatter}`);

            await this.config.update(this.DEFAULT_FORMATTER_KEY_NAME, formatter, ConfigurationTarget.Workspace, true);
            await commands.executeCommand(this.formatAction);
        }

        // Return back to the original configuration
        await this.config.update(this.DEFAULT_FORMATTER_KEY_NAME, this.defaultFormatter, ConfigurationTarget.Workspace, true);
        this.setRun(false);
    }
};
