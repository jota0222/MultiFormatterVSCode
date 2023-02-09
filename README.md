# Multi Formatter Extension

***VisualStudio Code Extension***

## About the Extension

With this extension you will be able to use more than one formatter for the same language, which make it easier to keep your code as neat as possible when one formatter do different things than others. With this extension you will be able to run, for example, the three: Prettier, Eslint and Visual Studio Code formatters in just one run and in the order you prefer to get the best results.

## Installation

You can find the extension in the Visual Studio Code extension store, however, you can build it and install it yourself by running following commands:

```bash
npm run build
code --install-extension multi-formatter-1.0.0.vsix
```

## Configuration

When the extension is installed for the first time, you will need to configure the order in which the formatters will run, so, for example for JavaScript and PHP you can add the following to your `settings.json` or your `*.code-workspace` file under the `settings` attribute:

```json
{
    "[javascript]": {
        "editor.defaultFormatter": "vscode.typescript-language-features",
        "multiFormatter.formatterList": [
            "dbaeumer.vscode-eslint",
            "vscode.typescript-language-features"
        ],
    },
    "[php]": {
        "editor.defaultFormatter": "Jota0222.multi-formatter",
        "multiFormatter.formatterList": [
            "wongjn.php-sniffer",
            "bmewburn.vscode-intelephense-client"
        ],
    }
}
```

So, for the example above, **Eslint** will run first than the **TypeScript** formatter for **Javascript** files, and **PHP Sniffer** will run before **Intelephense** formatter for **PHP** files. If you don't provide any formatter, the extension will use the default one.

Also, as you can see in the examples, you can also set this extension as the default formatter (`Jota0222.multi-formatter`) but it will not do a thing unless you have another formatter in the list.

You can get the name of the formatters to use from the available options that appear when editing the `editor.defaultFormatter` directly from the json file.

## Execution

Once its configured you have 2 ways to run this formatter:

### Using it as language formatter

This extension will appear as a formatter for the supported languages (see "Supported languages and frameworks" section below), so you will be able to run it using the VSCode integrated features like the shortcut `Alt` + `Shift` + `F` or the actions `Format document with...`, `Format Selection with...`, `Format on save`, etc.

### Running extesion defined actions

This extesion comes with 2 actions that you can configure the way you want and add the shortcuts you want, so they can run appart of the formatter itself. Their names are **`MultiFormat Document`** and **`MultiFormat Selection`.**

![MultiFormat available actions](image/README/MultiFormat%20available%20actions.png)

## Supported languages and frameworks

* JavaScript
* TypeScript
* React (JSX and TSX)
* Vue
* HTML
* CSS
* SCSS
* Python
* PHP

It's probably easy to add more of them to the list as this depends on other fomatters and it's not a formatter by itself, so feel free to add by yourself any language you want in the `package.json` under `activationEvents` and also in the file `src\supported-languages.ts`, test it and create a pull request to this repo 🧐👍.

# License

This code is licensed under [GNU GPLv3](./LICENSE)
