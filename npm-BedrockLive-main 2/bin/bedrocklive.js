#!/usr/bin/env node

import { main } from '../dist/app.js';

process.on('SIGINT', () => {
    console.log('\n👋 Thanks for using BedrockLive!');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n👋 BedrockLive terminated.');
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main().catch((error) => {
    console.error('Failed to start BedrockLive:', error);
    process.exit(1);
});
