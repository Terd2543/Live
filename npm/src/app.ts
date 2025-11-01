import chalk from "chalk";
import gradient from "gradient-string";
import { TIKTOK_CONFIG } from "./config/tiktok.js";
import { connect } from "./core/bedrocklive.js";

export async function main() {
    console.log(gradient(["#7F00FF", "#3ff431"]).multiline("Welcome to BedrockLive!"));

    // ใช้ ENV แทน input
    TIKTOK_CONFIG.tiktokUsername = process.env.TIKTOK_USERNAME || "default_user";
    TIKTOK_CONFIG.port = Number(process.env.PORT) || 3000;
    TIKTOK_CONFIG.waitUntilLive = process.env.WAIT_UNTIL_LIVE === "true";
    TIKTOK_CONFIG.enableGiftInfo = true;

    try {
        await connect(TIKTOK_CONFIG);
    } catch (error) {
        console.error(chalk.red(`Failed to connect to TikTok: ${error.message}`));
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
