import chalk from "chalk";
export class TikTokEventHandler {
    _tiktokLive;
    /**
     * Creates a new TikTok event handler.
     * @param tiktokConnection - The TikTok TikTokLiveConnection instance.
     */
    constructor(tiktokConnection) {
        this._tiktokLive = tiktokConnection;
    }
    /**
     * Registers an event handler for the specified event.
     * @param eventName - The name of the event to handle.
     * @param handler - The event handler function.
     * @returns The TikTokLiveConnection instance.
     */
    onEvent(eventName, handler) {
        return this._tiktokLive.on(eventName, (data) => {
            try {
                handler(data);
            }
            catch (error) {
                console.error(chalk.red(`Error handling ${eventName} event: ${error?.message || error}`));
                if (error instanceof Error && error.stack) {
                    console.error(chalk.red('Stack trace:'), error.stack);
                }
            }
        });
    }
}
