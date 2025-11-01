import { WebSocket } from "ws";
import chalk from "chalk";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import MinecraftCommandHandler from "../minecraft/minecraft-command-handler.js";
export default class MinecraftConnection extends EventEmitter {
    static _instance;
    _minecraftWss;
    _commandHandler;
    _activeClient;
    constructor(minecraftWss) {
        super();
        this._minecraftWss = minecraftWss;
        this._commandHandler = new MinecraftCommandHandler();
        this.listen();
    }
    static instance(minecraftWss) {
        if (!this._instance) {
            this._instance = new MinecraftConnection(minecraftWss);
        }
        return this._instance;
    }
    listen() {
        this._minecraftWss.on("connection", (ws) => {
            if (this._activeClient && this._activeClient.readyState === WebSocket.OPEN) {
                console.warn(chalk.yellow("New Minecraft client connected, but an active one already exists. Closing new connection."));
                ws.close();
                return;
            }
            console.log(chalk.greenBright("Minecraft Connection Established!"));
            this._activeClient = ws;
            this._commandHandler.setActiveConnection(ws);
            ws.on("message", (message) => {
                try {
                    const msg = JSON.parse(message.toString());
                    if (!msg.header || !msg.header.messagePurpose) {
                        console.warn(chalk.yellow(`Received message without a valid header: ${message}`));
                        return;
                    }
                    if (msg.header.messagePurpose === "event") {
                        if (typeof msg !== "object" && !msg.header && !msg.body) {
                            console.warn(chalk.yellow("Received invalid event message: ", msg));
                            return;
                        }
                        this.emit(msg.header.eventName, msg);
                    }
                    else if (msg.header.messagePurpose === "commandResponse") {
                        this._commandHandler.handleCommandResponse(msg);
                    }
                    else if (msg.header.messagePurpose === "error") {
                        console.error(chalk.red(`Minecraft Error Message: ${msg.body?.statusCode} - ${msg.body?.statusMessage}`));
                        if (msg.header.requestId && msg.body) {
                            this._commandHandler.handleCommandResponse(msg);
                        }
                    }
                    else {
                        console.warn(chalk.yellow(`Unknown message purpose: ${msg.header.messagePurpose}`), msg);
                    }
                }
                catch (error) {
                    console.error(chalk.yellowBright(`Failed to parse message: ${error.message}`), `Message: ${message}`);
                }
            });
            ws.on("error", (error) => {
                console.error(chalk.red(`Minecraft connection error: ${error}`));
                if (this._activeClient === ws) {
                    this._activeClient = undefined;
                    this._commandHandler.setActiveConnection(undefined);
                }
            });
            ws.on("close", () => {
                console.log(chalk.yellowBright("Minecraft connection closed."));
                if (this._activeClient === ws) {
                    this._activeClient = undefined;
                    this._commandHandler.setActiveConnection(undefined);
                }
                this.emit("disconnected");
            });
            this.emit("connected", ws);
        });
    }
    flushQueue() {
        this._commandHandler.flushQueue();
    }
    subscribeToEvents(events) {
        const sendSubscription = (client) => {
            events.forEach((event) => {
                const subscribeRequest = {
                    header: {
                        version: 1,
                        requestId: uuidv4(),
                        messagePurpose: "subscribe",
                        messageType: "commandRequest",
                    },
                    body: {
                        eventName: event,
                    },
                };
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(subscribeRequest));
                }
            });
        };
        if (this._activeClient && this._activeClient.readyState === WebSocket.OPEN) {
            sendSubscription(this._activeClient);
        }
        else {
            this.once('connected', sendSubscription);
        }
    }
    /**
     * runs a minecraft command
     * @param {string} command The command to send.
     */
    requestCommand(command) {
        const commandRequest = this._commandHandler.createCommandRequest(command);
        this._commandHandler.enqueueCommand(commandRequest);
    }
    /**
     * Sends a script event to the Minecraft server.
     * @param {string} eventId The ID of the event.
     * @param {string} message The message to send with the event.
     */
    sendScriptEvent(eventId, message) {
        this.requestCommand(`scriptevent ${eventId} ${message}`);
    }
}
