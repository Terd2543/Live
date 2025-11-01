import chalk from "chalk";
import { TikTokLiveConnection } from "tiktok-live-connector";
import { EventEmitter } from "events";
import { TikTokEventHandler } from "./tiktok-event-handler.js";
/**
 * TikTok Connection
 * @extends EventEmitter
 */
export class TikTokConnection extends EventEmitter {
    static _instance;
    _config;
    _tiktokConnection;
    _tiktokEventHandler;
    _reconnectAttempts = 0;
    _isReconnecting = false;
    /**
     * Initializes the TikTok connection.
     * @param config - TikTok Live server configuration
     */
    constructor(config) {
        super();
        this.validateConfig(config);
        this._config = config;
        this.initialize();
    }
    get tiktokUsername() {
        return this._config.tiktokUsername;
    }
    get port() {
        return String(this._config.port || '3000');
    }
    /**
     * Ensures only one instance of TikTokConnection is created.
     * @param config - TikTok Live server configuration
     * @param connectionManager - Connection manager instance
     * @returns The instance of TikTokConnection
     */
    static instance(config) {
        if (!TikTokConnection._instance) {
            TikTokConnection._instance = new TikTokConnection(config);
        }
        return TikTokConnection._instance;
    }
    /**
     * Retrieves the TikTok event handler.
     */
    get events() {
        return this._tiktokEventHandler;
    }
    /**
     * Retrieves the TikTokLiveConnection instance.
     * Use this to call connect(), disconnect(), etc.
     */
    connection() {
        return this._tiktokConnection;
    }
    /**
     * Check if the configured user is currently live
     */
    async isLive() {
        try {
            return await this._tiktokConnection.fetchIsLive();
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error checking live status';
            console.error(chalk.red("Error checking live status:"), errorMessage);
            return false;
        }
    }
    /**
     * Wait until the user goes live
     */
    async waitUntilLive() {
        return this._tiktokConnection.waitUntilLive(180);
    }
    /**
     * Fetch available gifts
     */
    async fetchAvailableGifts() {
        try {
            return await this._tiktokConnection.fetchAvailableGifts();
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error fetching available gifts';
            console.error(chalk.red("Error fetching available gifts:"), errorMessage);
            return null;
        }
    }
    async connect() {
        try {
            if (this._config.waitUntilLive) {
                await this.waitUntilLive();
            }
            const result = await this._tiktokConnection.connect();
            this._reconnectAttempts = 0;
            this._isReconnecting = false;
            return result;
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown connection error';
            console.error(chalk.red(errorMessage));
            console.error(chalk.red(`Failed to connect to ${this._config.tiktokUsername} TikTok Live Stream.`));
            throw error;
        }
    }
    async handleReconnection() {
        const maxAttempts = this._config.maxReconnectAttempts || 5;
        if (this._reconnectAttempts >= maxAttempts) {
            console.error(chalk.red(`Reconnection attempts (${maxAttempts}) reached. Giving up.`));
            return;
        }
        this._isReconnecting = true;
        this._reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 30000);
        console.log(chalk.yellow(`Reconnecting in ${delay / 1000}s (attempt ${this._reconnectAttempts}/${maxAttempts})...`));
        setTimeout(async () => {
            try {
                await this.connect();
                console.log(chalk.green("Successfully reconnected!"));
            }
            catch (error) {
                const errorMessage = error?.message || error?.toString() || 'Unknown reconnection error';
                console.error(chalk.red("Reconnection failed:"), errorMessage);
                await this.handleReconnection();
            }
        }, delay);
    }
    /**
     * Initializes the TikTok connection.
     */
    initialize() {
        this._tiktokConnection = new TikTokLiveConnection(this._config.tiktokUsername);
        this._tiktokEventHandler = new TikTokEventHandler(this._tiktokConnection);
    }
    /**
     * Validates the TikTok Live server configuration.
     * @param config - TikTok Live server configuration
     */
    validateConfig(config) {
        if (!config.tiktokUsername) {
            console.error(chalk.red("TikTok username is required."));
            process.exit(1);
        }
    }
}
