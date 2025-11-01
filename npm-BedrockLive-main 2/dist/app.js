import chalk from "chalk";
import gradient from "gradient-string";
import { TIKTOK_CONFIG } from "./config/tiktok.js";
import { connect } from "./core/bedrocklive.js";
import { inquireConfig } from "./utils/prompts.js";
export async function main() {
    console.log(gradient(["#7F00FF", "#3ff431"]).multiline("Welcome to BedrockLive!"));
    try {
        const config = await inquireConfig();
        TIKTOK_CONFIG.tiktokUsername = config.TIKTOK_USERNAME;
        TIKTOK_CONFIG.port = config.PORT;
        TIKTOK_CONFIG.waitUntilLive = config.WAIT_UNTIL_LIVE;
        TIKTOK_CONFIG.enableGiftInfo = true;
    }
    catch (error) {
        console.error(chalk.red("Failed to get configuration:", error.message));
        process.exit(1);
    }
    try {
        await connect(TIKTOK_CONFIG);
    }
    catch (error) {
        console.error(chalk.red(`Failed to connect to TikTok: ${error.message}`));
        console.info(chalk.yellow("Try again."));
        process.exit(1);
    }
}
;
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
