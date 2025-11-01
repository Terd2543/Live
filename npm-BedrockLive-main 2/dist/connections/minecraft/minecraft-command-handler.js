import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import chalk from "chalk";
export default class MinecraftCommandHandler {
    _pendingCommandRequests = [];
    _awaitedQueue = {};
    _timeOut = 5000;
    _minecraftWs;
    setActiveConnection(mcWs) {
        this._minecraftWs = mcWs;
        if (mcWs) {
            this.processSendQueue();
        }
    }
    createCommandRequest(command) {
        return {
            header: {
                version: 1,
                requestId: uuidv4(),
                messagePurpose: "commandRequest",
                messageType: "commandRequest",
            },
            body: {
                version: 1,
                commandLine: command,
                origin: {
                    type: "player",
                },
            },
        };
    }
    enqueueCommand(commandRequest) {
        this._pendingCommandRequests.push(commandRequest);
        this.processSendQueue();
    }
    processSendQueue() {
        if (!this._minecraftWs || this._minecraftWs.readyState !== WebSocket.OPEN) {
            return;
        }
        const MAX_QUEUE_SIZE = 100;
        const awaitedQueueLength = Object.keys(this._awaitedQueue).length;
        let count = Math.min(MAX_QUEUE_SIZE - awaitedQueueLength, this._pendingCommandRequests.length);
        for (let i = 0; i < count; i++) {
            const currentCommandRequest = this._pendingCommandRequests.shift();
            if (!currentCommandRequest)
                continue;
            try {
                this._minecraftWs.send(JSON.stringify(currentCommandRequest));
                const timeoutId = setTimeout(() => {
                    console.warn(chalk.yellow(`Command ${currentCommandRequest.body.commandLine} (ID: ${currentCommandRequest.header.requestId}) timed out.`));
                    delete this._awaitedQueue[currentCommandRequest.header.requestId];
                    this.processSendQueue();
                }, this._timeOut);
                this._awaitedQueue[currentCommandRequest.header.requestId] = { message: currentCommandRequest, timeoutId, };
            }
            catch (error) {
                console.error(chalk.red(`Failed to send command: ${currentCommandRequest.body.commandLine}`), error.message);
            }
        }
    }
    handleCommandResponse(message) {
        if (typeof message !== "object" || !message.header || !message.body) {
            console.warn(chalk.yellow("Received invalid command response message: ", message));
            return;
        }
        const requestId = message.header.requestId;
        if (!(requestId in this._awaitedQueue)) {
            console.warn(chalk.yellow(`Received response for unknown request ID: ${requestId}`));
            return;
        }
        const { message: originalCommand, timeoutId } = this._awaitedQueue[requestId];
        clearTimeout(timeoutId);
        delete this._awaitedQueue[requestId];
        const statusCode = message.body.statusCode;
        const commandLine = originalCommand.body.commandLine;
        if (statusCode < 0) {
            const statusMessage = message.body.statusMessage || "No status message provided";
            console.log(chalk.red(`Error executing command: ${commandLine} - ${statusMessage}`));
        }
        this.processSendQueue();
    }
    flushQueue() {
        if (this._pendingCommandRequests.length === 0) {
            return;
        }
        console.log(chalk.cyan("Flushing command queue..."));
        this.processSendQueue();
    }
}
