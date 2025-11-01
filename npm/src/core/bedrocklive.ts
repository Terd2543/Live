import chalk from "chalk";
import gradient from "gradient-string";
import express from "express";
import { WebSocketServer } from "ws";
import { createSpinner } from "nanospinner";
import { Server, createServer } from "node:http";

export class BedrockLive {
  static _instance;
  _app;
  _server;
  _config;
  minecraftWss;

  constructor(config) {
    this._config = config;
    this._app = express();
    this._server = createServer(this._app);
  }

  static instance(config) {
    if (!BedrockLive._instance) {
      BedrockLive._instance = new BedrockLive(config);
    }
    return BedrockLive._instance;
  }

  async initialize() {
    try {
      this.minecraftWss = new WebSocketServer({ server: this._server });
    } catch (error) {
      console.error(chalk.red("Error during initialization: "), error.message);
      process.exit(1);
    }
  }

  async setup() {
    await this.startServer();
    console.log(chalk.green(`Server is running on port ${this._config.port}`));
  }

  startServer() {
    return new Promise((resolve, reject) => {
      this._server.listen(this._config.port, "0.0.0.0", () => {
        this._app.get("/", (req, res) => {
          res.send(`
            <h1 style="text-align: center;">BedrockLive</h1>
            <p style="text-align: center;">Connected to ${this._config.tiktokUsername}</p>
          `);
        });
        resolve();
      }).on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.error(chalk.yellowBright(`Port ${this._config.port} is already in use.`));
          process.exit(1);
        } else {
          reject(error);
        }
      });
    });
  }

  async connect() {
    const spinner = createSpinner(`Connecting to TikTok user: ${this._config.tiktokUsername}...`).start();
    setTimeout(() => spinner.success({ text: `Connected to TikTok user: ${this._config.tiktokUsername}` }), 2000);
    // Fake connection for demo purposes
    this.startPing();
  }

  startPing() {
    setInterval(() => {
      if (this.minecraftWss.clients.size === 0) {
        console.log("No Minecraft players connected.");
      } else {
        this.minecraftWss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) client.ping();
        });
      }
    }, 60 * 1000);
  }
}

export async function connect(config) {
  const instance = BedrockLive.instance(config);
  await instance.initialize();
  await instance.setup();
  await instance.connect();
  return instance;
}
