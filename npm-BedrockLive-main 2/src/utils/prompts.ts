// ระบบ prompt ถูกปิดเพื่อให้รองรับการ deploy บน Render / Railway

export async function inquireConfig() {
    // ป้องกันไม่ให้เรียก prompt ระหว่างรัน
    console.log("[INFO] inquireConfig() ถูกปิดใช้งาน (ใช้ค่าจาก .env แทน)");
    return {
        TIKTOK_USERNAME: process.env.TIKTOK_USERNAME || "terdy5554",
        PORT: Number(process.env.PORT) || 3000,
        WAIT_UNTIL_LIVE: process.env.WAIT_UNTIL_LIVE === "true" || false,
        ENABLE_GIFT_INFO: process.env.ENABLE_GIFT_INFO === "true" || true,
    };
}
