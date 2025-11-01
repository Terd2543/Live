import chalk from "chalk";
import gradient from "gradient-string";
import { TIKTOK_CONFIG } from "./config/tiktok.js";
import { connect } from "./core/bedrocklive.js";

export async function main() {
    console.log(
        gradient(["#7F00FF", "#3ff431"]).multiline("Welcome to BedrockLive!")
    );

    try {
        // แสดงค่าที่โหลดจาก .env หรือ environment variable
        console.log(chalk.cyan("Using configuration:"));
        console.log(chalk.yellowBright(`  Username: @${TIKTOK_CONFIG.tiktokUsername}`));
        console.log(chalk.yellowBright(`  Port: ${TIKTOK_CONFIG.port}`));
        console.log(chalk.yellowBright(`  Wait Until Live: ${TIKTOK_CONFIG.waitUntilLive}`));
        console.log(chalk.yellowBright(`  Enable Gift Info: ${TIKTOK_CONFIG.enableGiftInfo}`));
        console.log(chalk.yellowBright(`  Max Reconnect Attempts: ${TIKTOK_CONFIG.maxReconnectAttempts}`));
        console.log("");

        // เริ่มเชื่อมต่อโดยใช้ค่าจาก config
        await connect(TIKTOK_CONFIG);
    } catch (error) {
        console.error(chalk.red(`Failed to connect to TikTok: ${error.message}`));
        console.info(chalk.yellow("Try again later or check your configuration."));
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
