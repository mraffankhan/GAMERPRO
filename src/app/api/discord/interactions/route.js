import { NextResponse } from 'next/server';
import {
    InteractionType,
    InteractionResponseType,
    verifyKey,
} from 'discord-interactions';

export async function POST(request) {
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    const rawBody = await request.text();

    // 1. Verify the request came from Discord
    const isValidRequest = verifyKey(
        rawBody,
        signature,
        timestamp,
        process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
        return NextResponse.json({ error: 'Bad Request Signature' }, { status: 401 });
    }

    const message = JSON.parse(rawBody);

    // 2. Handle Verification Request (PING)
    if (message.type === InteractionType.PING) {
        return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // 3. Handle Slash Commands
    if (message.type === InteractionType.APPLICATION_COMMAND) {

        // Command: /gamerpro
        if (message.data.name === 'gamerpro') {
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '🎮 **GamerPro Bot is Online!**\nReady to manage tournaments and teams.',
                },
            });
        }

        // Command: /stats (Example)
        if (message.data.name === 'stats') {
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: '📊 **Platform Stats**\nTournaments: 12\nActive Teams: 45\nMatches Played: 128',
                },
            });
        }
    }

    return NextResponse.json({ error: 'Unknown Command' }, { status: 400 });
}
