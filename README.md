# Multi Format Extension

**_VisualStudio Code Extension_**

## About the Extension

With this extension you'll be able to use more than one formatter for the same language, which make it easier to keep your code as neat as possible when one formatter do different things than others. For example, you could run three formatters in a row—Prettier, Eslint and Visual Studio Code—in just one run and in the order you prefer to get the best results.

## Installation

You can find the extension in the Visual Studio Code extension store; you can build it and install it yourself by running following commands:

```bash
npm run build
code --install-extension multi-formatter-x.x.x.vsix
```

Where `x.x.x` is the current version number.

## Configuration

After the extension is installed, you'll need to configure two things: the languages you want to enable multi-format support for, and the formatters to run for each language.

To accomplish the first task, set a key-value pair that identifies the languages you want this extension to be activated on:

```jsonc
"multi-format.languages": ["erb", "javascript", "ruby"],
```

Then, you'd define the formatters you want to run per-language:

the order in which the formatters will run, so, for example for JavaScript and PHP you can add the following to your `settings.json` or your `*.code-workspace` file under the `settings` attribute:

```json
{
  "[erb]": {
    "editor.defaultFormatter": "aliariff.vscode-erb-beautify",
    "multi-format.formatters": [
      "esbenp.prettier-vscode",
      "manuelpuyol.erb-linter"
    ],
    "editor.formatOnSave": true
  }
}
```

In this example, `"aliariff.vscode-erb-beautify"` is set as the default for ERB files. After it executes, the `multi-format.formatters` will run in sequence—first `"esbenp.prettier-vscode"`, and then `"manuelpuyol.erb-linter"`. Note that even if a `defaultFormatter` was not defined, the sequence of `"multi-format.formatters"` would still execute.

## Running the extension

Whenever you save a document, the MultiFormat extension will run your formatters for you. There are additionally two more ways to run the extension.

### Using it as language formatter

This extension will appear as a formatter for the supported languages, so you'll be able to run it using the VSCode integrated features like the shortcut `Alt` + `Shift` + `F` or the actions `Format document with...`, `Format Selection with...`, `Format on save`, etc.

### Running extesion defined actions

This extesion comes with two actions that you can configure however you want and add the shortcuts you want, so they can run appart of the formatter itself. Their names are **`MultiFormat Document`** and **`MultiFormat Selection`.**

![MultiFormat available actions](image/README/MultiFormat%20available%20actions.png)

# License

This code is licensed under [GNU GPLv3](./LICENSE), and was originally forked from https://github.com/jota0222/MultiFormatterVSCode.
