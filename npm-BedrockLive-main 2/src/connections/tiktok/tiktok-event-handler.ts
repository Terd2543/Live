import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";
import chalk from "chalk";

export class TikTokEventHandler {
    private readonly _tiktokLive: TikTokLiveConnection;

    /**
     * Creates a new TikTok event handler.
     * @param tiktokConnection - The TikTok TikTokLiveConnection instance.
     */
    constructor(tiktokConnection: TikTokLiveConnection) {
        this._tiktokLive = tiktokConnection;
    }

    /**
     * Registers an event handler for the specified event.
     * @param eventName - The name of the event to handle.
     * @param handler - The event handler function.
     * @returns The TikTokLiveConnection instance.
     */
    public onEvent<T extends WebcastEvent>(eventName: T, handler: (data: any) => void): TikTokLiveConnection {
        return this._tiktokLive.on(eventName, (data: any) => {
            try {
                handler(data);
            } catch (error) {
                console.error(chalk.red(`Error handling ${eventName} event: ${error?.message || error}`));
                if (error instanceof Error && error.stack) {
                    console.error(chalk.red('Stack trace:'), error.stack);
                }
            }
        });
    }
}