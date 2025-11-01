import fs from "fs";
import path, { dirname } from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Inquires which plugins to load from available plugins
 * @returns Promise resolving to array of selected plugin modules
 */
export async function inquirePlugins(): Promise<PluginModule[]> {
    const pluginsDir = path.join(__dirname, "..", "plugins");
    
    if (!fs.existsSync(pluginsDir)) {
        console.log(chalk.yellow("No plugins directory found. Creating one..."));
        fs.mkdirSync(pluginsDir, { recursive: true });
        return [];
    }

    const pluginFolders = fs
        .readdirSync(pluginsDir)
        .filter((file) => fs.statSync(path.join(pluginsDir, file)).isDirectory());

    if (pluginFolders.length === 0) {
        console.log(chalk.yellow("No plugins found in plugins directory."));
        return [];
    }

    const availablePlugins = [];

    for (const folder of pluginFolders) {
        const pluginFolder = path.join(pluginsDir, folder);
        const mainPath = path.join(pluginFolder, "main.ts");
        const mainJsPath = path.join(pluginFolder, "main.js");

        // check for ts/js main file
        const actualMainPath = fs.existsSync(mainJsPath) ? mainJsPath : fs.existsSync(mainPath) ? mainPath : null;

        if (!actualMainPath) {
            console.warn(chalk.yellow(`Plugin ${folder} missing main.ts or main.js`));
            continue;
        }

        try {
            // import the plugin to get its manifest
            const pluginPath = pathToFileURL(actualMainPath).href;
            const pluginModule = await import(pluginPath);
            
            if (!pluginModule.manifest) {
                console.warn(chalk.yellow(`Plugin ${folder} missing manifest export`));
                continue;
            }

            if (!isManifestValid(pluginModule.manifest, folder)) continue;

            availablePlugins.push({
                name: `${pluginModule.manifest.name} v${pluginModule.manifest.version} by ${pluginModule.manifest.author}: ${pluginModule.manifest.description}`,
                short: `${pluginModule.manifest.name} by ${pluginModule.manifest.author}`,
                value: {
                    manifest: pluginModule.manifest,
                    mainFile: actualMainPath
                } as PluginModule,
            });
        } catch (error) {
            console.error(chalk.red(`Error loading plugin ${folder}:`), error.message);
        }
    }

    if (availablePlugins.length === 0) {
        console.log(chalk.yellow("No valid plugins found."));
        return [];
    }

    const { selectedPlugins } = await inquirer.prompt([
        {
            type: "checkbox",
            name: "selectedPlugins",
            message: `Select plugins to activate (${availablePlugins.length} available):`,
            choices: availablePlugins,
            validate: () => true,
            theme: {
                icon: {
                    checked: '🟢',
                    unchecked: '⚪',
                },
                prefix: {
                    done: '📦',
                },
            },
            instructions: "Use space to select/deselect, enter to confirm.",
        },
    ]);

    if (selectedPlugins.length > 0) {
        console.log(chalk.green(`Selected ${selectedPlugins.length} plugin(s)`));
    } else {
        console.log(chalk.yellow("⚠️ Proceeding without any plugins"));
    }

    return selectedPlugins;
}

/**
 * Validates a plugin manifest.
 * @param manifest The plugin manifest.
 * @param folder The plugin folder.
 * @returns True if the manifest is valid, false otherwise.
 */
function isManifestValid(manifest: any, folder: string): boolean {
    const requiredFields = ["name", "description", "version", "author"];
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

    for (const field of requiredFields) {
        if (!manifest[field]) {
            console.warn(chalk.yellow(`Plugin ${folder} is missing required field: ${field}`));
            return false;
        }
    }

    if (!semverRegex.test(manifest.version)) {
        console.warn(chalk.yellow(`Plugin ${folder} has an invalid version: ${manifest.version}`));
        return false;
    }

    return true;
}
