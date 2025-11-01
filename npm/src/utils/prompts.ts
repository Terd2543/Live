import inquirer from "inquirer";
import { TIKTOK_CONFIG } from "../config/tiktok.js";

export interface ConfigPromptResult {
    TIKTOK_USERNAME: string;
    PORT: number;
    WAIT_UNTIL_LIVE: boolean;
}

export async function inquireConfig(): Promise<ConfigPromptResult> {
    const config = await inquirer.prompt([
        {
            name: "TIKTOK_USERNAME",
            type: "input",
            message: "Enter TikTok username (must be live):",
            default: TIKTOK_CONFIG.tiktokUsername,
            validate: function (value) {
                if (value.trim()) return true;
                return "Please enter a valid TikTok username.";
            },
        },
        {
            name: "PORT",
            type: "input",
            message: "Enter the port number:",
            default: "3000",
            validate: function (value) {
                const valid = !isNaN(parseInt(value));
                return valid || "Please enter a valid number for the port.";
            },
            filter: (value) => parseInt(value),
        },
        {
            name: "WAIT_UNTIL_LIVE",
            type: "confirm",
            message: "Wait until the user goes live before connecting?",
            default: false,
        },
    ]);

    return config;
}
