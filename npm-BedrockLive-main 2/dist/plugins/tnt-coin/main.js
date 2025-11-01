import { WebcastEvent } from "tiktok-live-connector";
export const manifest = {
    name: "TNT Coin",
    description: "A plugin to support the TNT Coin addon for interactions",
    version: "1.2.0",
    author: "Rqinix"
};
/**
 * BedrockLive plugin.
 * @param bedrockLive The BedrockLive instance.
 */
export function plugin(bedrockLive) {
    const { tiktok, minecraft } = bedrockLive;
    const newFollowers = [];
    const data = { tiktokUsername: tiktok.tiktokUsername };
    bedrockLive.minecraftWss.on('connection', () => {
        minecraft.requestCommand(`tellraw @a {"rawtext":[{"text":"§a§l§cTNT§f §eCoin§f §aplugin loaded§f!"}]}`);
        minecraft.requestCommand(`playsound random.levelup @a`);
        minecraft.requestCommand(`scriptevent tntcoin:connected ${JSON.stringify(data)}`);
    });
    tiktok.events.onEvent(WebcastEvent.MEMBER, (data) => {
        const message = JSON.stringify({
            username: data.user.uniqueId,
            nickname: data.user.nickname,
        });
        minecraft.sendScriptEvent("tntcoin:join", message);
    });
    tiktok.events.onEvent(WebcastEvent.CHAT, (data) => {
        const message = JSON.stringify({
            username: data.user.uniqueId,
            nickname: data.user.nickname,
            comment: data.comment,
        });
        minecraft.sendScriptEvent("tntcoin:chat", message);
    });
    tiktok.events.onEvent(WebcastEvent.LIKE, (data) => {
        const message = JSON.stringify({
            username: data.user.uniqueId,
            nickname: data.user.nickname,
            likeCount: data.likeCount,
            totalLikeCount: data.totalLikeCount,
        });
        minecraft.sendScriptEvent("tntcoin:like", message);
    });
    tiktok.events.onEvent(WebcastEvent.GIFT, (data) => {
        const message = JSON.stringify({
            username: data.user.uniqueId,
            nickname: data.user.nickname,
            giftName: data.giftDetails?.giftName || `Gift ${data.giftId}`,
            giftId: data.giftId,
            repeatCount: data.repeatCount,
            giftType: data.giftDetails?.giftType || 1,
            diamondCount: data.giftDetails?.diamondCount || 0,
            repeatEnd: data.repeatEnd,
        });
        minecraft.sendScriptEvent("tntcoin:gift", message);
    });
    tiktok.events.onEvent(WebcastEvent.FOLLOW, (data) => {
        if (newFollowers.includes(data.user.userId))
            return;
        newFollowers.push(data.user.userId);
        const message = JSON.stringify({
            username: data.user.uniqueId,
            nickname: data.user.nickname,
        });
        minecraft.sendScriptEvent("tntcoin:follow", message);
    });
    tiktok.events.onEvent(WebcastEvent.SHARE, (data) => {
        const message = JSON.stringify({
            username: data.user.uniqueId,
            nickname: data.user.nickname,
        });
        minecraft.sendScriptEvent("tntcoin:share", message);
    });
}
