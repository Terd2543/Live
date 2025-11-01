<div align="center">

<img src="https://github.com/rqinix/BedrockLive/blob/main/docs/images/bedrocklive.png?raw=true" alt="BedrockLive Logo" width="200">

# BedrockLive

[![npm version](https://img.shields.io/npm/v/bedrocklive.svg)](https://www.npmjs.com/package/bedrocklive)
[![npm downloads](https://img.shields.io/npm/dm/bedrocklive.svg)](https://www.npmjs.com/package/bedrocklive)
![GitHub Downloads](https://img.shields.io/github/downloads/rqinix/BedrockLive/total?color=brightgreen&logo=github)
[![GitHub stars](https://img.shields.io/github/stars/rqinix/bedrocklive.svg)](https://github.com/rqinix/BedrockLive/stargazers)
[![GitHub license](https://img.shields.io/github/license/rqinix/bedrocklive.svg)](https://github.com/rqinix/BedrockLive/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1280028960129941584?logo=discord&label=Discord)](https://discord.gg/U474DVQ8)

**Turn your Minecraft streams into interactive TikTok experiences. Connect live stream events directly to your game world.**
</div>

BedrockLive transforms your Minecraft Bedrock streams into fully interactive experiences where your TikTok audience becomes part of the gameplay. Through real-time event binding, viewer actions like sending gifts, following, sharing, or chatting trigger immediate responses in your Minecraft world.

Built specifically for Minecraft Bedrock/Pocket Edition, The system operates through a local server that captures TikTok events and translates them into Minecraft commands, allowing for unlimited creative possibilities in viewer engagement.

Whether you're running building challenges, survival scenarios, or custom game modes, BedrockLive gives you the tools to create interactive content that keeps viewers engaged and encourages participation through the platform's gifting and social features.

## 🚀 Quick Start

## 📋 Requirements

- **Minecraft Bedrock/Pocket Edition** (Mobile, Windows 10+, Xbox, etc.)
- **TikTok Account** with live streaming capability
- [Node.js (LTS recommended)](https://nodejs.org/en/download) (For Desktop)
- [Termux](https://f-droid.org/packages/com.termux/) if you are using Android

## 💻 Initial Setup

### For Desktop Users (Windows/Mac/Linux)

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/en/download)

2. **Open Terminal/Command Prompt**
   - **Windows**: Press `Win + R`, type `cmd`, press Enter
   - **Mac**: Press `Cmd + Space`, type `terminal`, press Enter  
   - **Linux**: Press `Ctrl + Alt + T`

3. **Verify Installation**

```bash
node --version
npm --version
```

You should see version numbers for both commands.

### For Android Users (Termux)

1. **Install Termux**
   - Download from [F-Droid](https://f-droid.org/packages/com.termux/) (recommended)
   - Or from Google Play Store

2. **Setup Termux Environment**

```bash
pkg update && pkg upgrade
pkg install nodejs-lts
```

3. **Verify Installation**

```bash
node --version
npm --version
```

## 🛠️ Install BedrockLive

## Global Installation (Recommended)

```bash
npm install -g bedrocklive
bedrocklive
```

### Local Installation (No Global Install)

```bash
npx bedrocklive
```

### From Source (For Developers)

```bash
git clone https://github.com/rqinix/BedrockLive.git
cd bedrocklive
npm install
npm start
```

Follow the interactive prompts:

- Enter your TikTok username
- Set the port (default: 3000)
- Choose whether to wait until you're live
- Select plugins to activate

### Connect Minecraft

In your Minecraft:

Open Minecraft chat and type:

```
/connect localhost:3000
```

### Start Your TikTok Live Stream

Your Minecraft world is now connected to your TikTok Live stream! 🎉

---

## 🚨 Troubleshooting

### Connection Issues

**Minecraft says "Could not connect":**

1. Make sure websocket is enabled in your Minecraft settings
2. Check if BedrockLive is running and shows the correct port
3. Try using your computer's IP address instead of `localhost`
4. Ensure firewall isn't blocking the connection
5. On mobile, make sure you're on the same WiFi network

**TikTok connection fails:**

1. Verify your TikTok username is correct
2. Make sure you're currently live streaming
3. Check your internet connection
4. Try restarting BedrockLive

### Finding Your IP Address

**Windows:**
```cmd
ipconfig
```

**Mac/Linux:**
```bash
ifconfig
```

Look for your local IP (usually starts with 192.168.x.x)

---

## 🔌 Plugin System

### Creating a Plugin

Create a file in `plugins/my-plugin/main.ts`:

```typescript
import { BedrockLive } from "../../core/bedrocklive.js";
import { WebcastEvent } from "tiktok-live-connector";

// Plugin metadata - displayed in the plugin list
export const manifest = {
    name: "My Awesome Plugin",
    description: "Does amazing things with TikTok events",
    version: "1.0.0",
    author: "Your Name"
};

// Main plugin function - BedrockLive calls this when the plugin loads
export function plugin(bedrockLive: BedrockLive): void {
    const { tiktok, minecraft } = bedrockLive;

    // ...

}
```

### 🌐 TikTok Live Events

BedrockLive uses the [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector) library to capture real-time events from TikTok streams. For a complete list of events, see **[TikTok Live Events](https://github.com/zerodytrash/TikTok-Live-Connector#events)**.

##### Most Common Events

| Event | Description |
|-------|---------|
| `WebcastEvent.CHAT` | Chat messages |
| `WebcastEvent.GIFT` | Gifts sent to streamer |
| `WebcastEvent.LIKE` | Stream likes/hearts |
| `WebcastEvent.FOLLOW` | New followers |
| `WebcastEvent.MEMBER` | Viewers joining |
| `WebcastEvent.ROOM_USER` | Viewer count updates |

##### 🔧 Quick Example

```typescript
export function plugin(bedrockLive: BedrockLive): void {
    const { tiktok, minecraft } = bedrockLive;

    // Basic event handling in a plugin
    tiktok.events.onEvent(WebcastEvent.CHAT, (data) => {
        if (data.comment.toLowerCase() === "tnt") {
            minecraft.requestCommand(`summon tnt ~ ~5 ~`);
        }
    });

    tiktok.events.onEvent(WebcastEvent.GIFT, (data) => {
        if (data.giftId === 5655) { // Rose gift
            minecraft.requestCommand(`summon tnt ~ ~5 ~`);
        }
    });

    // ...
}
```

When Minecraft connects to BedrockLive:

```ts
bedrockLive.minecraftWss.on('connection', () => {
    minecraft.requestCommand(`tellraw @a {"rawtext":[{"text":"§a§lMY PLUGIN§f §aplugin loaded§f!"}]}`);
    minecraft.requestCommand(`playsound random.levelup @a`);
});
```

### 🎯 Want to Share Your Plugin?

Created an awesome plugin for BedrockLive? **We'd love to feature it!**

Submit a pull request to add your plugin to our showcase, or share it in our [Discord community](https://discord.gg/U474DVQ8). Help other streamers level up their content!

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/rqinix/BedrockLive.git
cd bedrocklive
npm install
npm run dev
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector) - The awesome library that makes TikTok integration possible
- [Minecraft Bedrock WSS](https://www.s-anand.net/blog/programming-minecraft-with-websockets/) - Minecraft Bedrock WebSocket reference
- Community contributors and content creators using BedrockLive

## 📞 Support

- **Discord:** [BedrockLive](https://discord.gg/U474DVQ8)
- **Issues:** [GitHub Issues](https://github.com/rqinix/bedrockBedrockLive)
- **Email:** rqinix.io@gmail.com

---

<div align="center">

**⭐ Star this repository if BedrockLive helped your stream! ⭐**

</div>