import chalk from "chalk";
import gradient from "gradient-string";
import express from "express";
import { WebSocketServer } from "ws";
import { createSpinner } from "nanospinner";
import { Server, createServer } from "node:http";
import MinecraftConnection from "../connections/minecraft/minecraft-connection.js";
import { TikTokConnection } from "../connections/tiktok/tiktok-connection.js";
import { WebcastEvent } from "tiktok-live-connector";
import { pathToFileURL } from "node:url";
import { inquirePlugins } from "./load-plugins.js";

export class BedrockLive {
    public static _instance: BedrockLive;
    private _app: express.Express;
    private _server: Server;
    private _config: TikTokLiveServerConfig;
    private _minecraftConnection: MinecraftConnection;
    public _tiktokConnection: TikTokConnection;
    private _arePluginsLoaded: boolean = false;
    private _selectedPlugins: PluginModule[] = [];
    public minecraftWss: WebSocketServer;

    /**
     * Initializes the bridge with the provided configuration.
     * @param config - TikTok Live server configuration
     */
    private constructor(config: TikTokLiveServerConfig) {
        this._config = config;
        this._app = express();
        this._server = createServer(this._app);
    }

    /**
     * Ensures only one instance of BedrockLive is created.
     * @param config - TikTok Live server configuration
     * @returns The instance of BedrockLive
     */
    public static instance(config: TikTokLiveServerConfig): BedrockLive {
        if (!BedrockLive._instance) {
            BedrockLive._instance = new BedrockLive(config);
        }
        return BedrockLive._instance;
    }

    public async initialize(): Promise<void> {
        try {
            this.minecraftWss = new WebSocketServer({ server: this._server });
            this._minecraftConnection = MinecraftConnection.instance(this.minecraftWss);
            this._tiktokConnection = TikTokConnection.instance(this._config);
        
            this._minecraftConnection.on('connected', async () => {
                if (!this._arePluginsLoaded) {
                    console.warn(chalk.yellow("Plugins should already be loaded. This is unexpected."));
                }
                this._minecraftConnection.flushQueue();
            });
        } catch (error) {
            console.error(chalk.red("Error during initialization: "), error.message);
            process.exit(1);
        }
    }

    /**
     * Sets up the server, connects to TikTok, and loads plugins.
     */
    public async setup(): Promise<void> {
        try {
            // Load local plugins
            this._selectedPlugins = await inquirePlugins();
            
            await this.startServer();
            await this.connectToTikTok();
        } catch (error) {
            console.error(chalk.red("Error during setup: "), error.message);
            process.exit(1);
        }

        this.minecraftWss.on("error", (error) => {
            console.error(chalk.red("WebSocket Server Error:"), error.message);
        });
    }

    /**
     * Starts the Express server and listens on the configured port.
     * @returns A promise that resolves when the server is started.
     */
    private startServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._server.listen(this._config.port, '0.0.0.0', () => {
                this._app.get("/", (req, res) => {
                    res.send(`
                        <h1 style="text-align: center;">BedrockLive</h1>
                        <p style="text-align: center;">Connected to ${this._config.tiktokUsername}</p>
                        <p style="text-align: center;">Loaded Plugins: ${this._selectedPlugins.length}</p>
                    `);
                });
                resolve();
            })
                .on("error", (error: NodeJS.ErrnoException) => {
                    if (error.code === "EADDRINUSE") {
                        console.error(chalk.yellowBright(`Port ${this._config.port} is already in use.`));
                        process.exit(1);
                    } else {
                        reject(error);
                    }
                });
        });
    }
    
    /**
     * Connects to the TikTok Live stream using the provided configuration.
     * @returns A promise that resolves when the connection is established.
     */
    private async connectToTikTok(): Promise<void> {
        const username = chalk.cyanBright.bold(this._config.tiktokUsername);
        const spinner = createSpinner(
            `Connecting to ${username} TikTok Live Stream...`,
            {
                frames: ["[-]", "[\\]", "[|]", "[/]"],
                interval: 50,
                color: "yellow",
            }
        ).start();

        // Handle stream end event
        this._tiktokConnection.events.onEvent(WebcastEvent.STREAM_END, () => {
            spinner.update({ text: chalk.redBright(`The TikTok Live Stream has ended.`), });
            this.shutdown();
        });

        try {
            // wait the user to go live
            if (this._config.waitUntilLive) {
                spinner.update({ text: `Waiting for ${username} to go live...` });
                await this._tiktokConnection.waitUntilLive();
                spinner.update({ text: `${username} is now live! Connecting...` });
            }

            // connect to TikTok Live
            const res = await this._tiktokConnection.connect();
            if (!res) {
                spinner.error({ text: `Failed to connect ${username} TikTok Live Stream.` });
                process.exit(1);
            }

            // load local plugins
            if (!this._arePluginsLoaded) {
                spinner.update({ text: `Loading ${this._selectedPlugins.length} local plugin(s)...` });
                await this.loadPlugins();
                this._arePluginsLoaded = true;
                spinner.success({ text: `Loaded ${this._selectedPlugins.length} local plugin(s).` });
            }

            // log number of available gifts if enabled
            if (this._config.enableGiftInfo) {
                try {
                    const gifts = await this._tiktokConnection.fetchAvailableGifts();
                    if (gifts && gifts.length > 0) {
                        spinner.info({ mark: '🎁', text: `Available gifts: ${gifts.length}`});
                    }
                } catch (error) {
                    spinner.warn({ text: `Could not fetch gift info: ${error.message}` });
                }
            }
            spinner.success({ text: `Connected to ${username} TikTok Live Stream.` });
            spinner.success({ text: chalk.greenBright.bold(`Open Minecraft and run the command '${"/connect localhost:" + this._config.port}' to connect.`) });
            spinner.info({ mark: '🛑', text: chalk.yellowBright.bold("Press Ctrl + C to stop the server.") });
            spinner.stop();
            this.startPing();
        } catch (error) {
            spinner.error({ text: `Failed to connect ${username} TikTok Live Stream.`, });
            process.exit(1);
        }
    }

    /**
     * Loads and initializes the selected local plugins.
     */
    private async loadPlugins(): Promise<void> {
        if (this._selectedPlugins.length === 0) {
            return;
        }

        for (const pluginModuleInfo of this._selectedPlugins) {
            try {
                const pluginPath = pathToFileURL(pluginModuleInfo.mainFile).href;
                const { plugin: pluginFunction } = await import(pluginPath);
                if (typeof pluginFunction === 'function') {
                    pluginFunction(this);
                } else {
                    console.error(chalk.red(`Plugin ${pluginModuleInfo.manifest.name} from ${pluginModuleInfo.mainFile} does not export a 'plugin' function.`));
                }
            } catch (error) {
                console.error(
                    chalk.red(`Failed to load or initialize plugin: ${pluginModuleInfo.manifest.name} (from ${pluginModuleInfo.mainFile})`),
                    error.message,
                    error.stack
                );
            }
        }
    }

    /**
     * Getter for TikTok connection instance.
     * @returns TikTokConnection instance
     */
    public get tiktok(): TikTokConnection {
        return this._tiktokConnection;
    }

    /**
     * Getter for Minecraft connection instance.
     * @returns MinecraftConnection instance
     */
    public get minecraft(): MinecraftConnection {
        return this._minecraftConnection;
    }

    /**
     * Starts the ping interval to keep WebSocket connections alive.
     */
    private pingInterval: NodeJS.Timeout | null = null;

    private startPing(): void {
        try {
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }

            this.pingInterval = setInterval(() => {
                // Ping Minecraft WebSocket clients
                if (this.minecraftWss.clients.size === 0) {
                    console.log("No Minecraft players connected.");
                } else {
                    this.minecraftWss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) client.ping();
                    });
                }
            }, 60 * 1000); // 1 minute
        } catch (error) {
            console.error(chalk.red("Error starting ping interval:"), error.message);
        }
    }

    /**
     * Shuts down the server and closes all connections.
     * @param exit - Whether to exit the process after shutdown.
     * @returns A promise that resolves when the server is shut down.
     */
    public async shutdown(exit: boolean = true): Promise<void> {
        console.log(chalk.yellow('🛑 Shutting down BedrockLive...'));

        // Disconnect TikTok
        this._tiktokConnection.connection().disconnect();

        // Clear ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        // Close Minecraft WebSocket clients
        this.minecraftWss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) client.close();
        });

        return new Promise((resolve, reject) => {
            this._server.close((err) => {
                if (err) {
                    console.error("Error closing server:", err.message);
                    if (exit) process.exit(1);
                    reject(err);
                } else {
                    console.log(chalk.grey("✅ BedrockLive shutdown complete"));
                    if (exit) process.exit(0);
                    resolve();
                }
            });
        });
    }
}

/**
 * Connects to the TikTok Live server using the provided configuration.
 * @param config - TikTok Live server configuration
 * @returns The BedrockLive instance
 */
export async function connect(config: TikTokLiveServerConfig): Promise<BedrockLive> {
    const bedrockLive = BedrockLive.instance(config);
    await bedrockLive.initialize();
    await bedrockLive.setup();
    return bedrockLive;
}

// Legacy alias for backward compatibility
export const TikTokLiveMcbe = BedrockLive;
