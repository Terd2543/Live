import { configDotenv } from "dotenv";

configDotenv();

export const TIKTOK_CONFIG: TikTokLiveServerConfig = {
    tiktokUsername: process.env.TIKTOK_USERNAME,
    port: Number(process.env.PORT) || 3000,
    waitUntilLive: process.env.WAIT_UNTIL_LIVE === 'true',
    enableGiftInfo: process.env.ENABLE_GIFT_INFO === 'true' || true,
    maxReconnectAttempts: Number(process.env.MAX_RECONNECT_ATTEMPTS) || 5,
};
