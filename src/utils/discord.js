const DISCORD_API_URL = 'https://discord.com/api/v10';

export async function createDiscordCategory(guildId, name) {
    if (!guildId) return null;

    try {
        const response = await fetch(`${DISCORD_API_URL}/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                type: 4, // 4 = GUILD_CATEGORY
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Discord API Error:', error);
            throw new Error(`Failed to create category: ${error.message}`);
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Create Category Error:', error);
        return null;
    }
}

export async function createDiscordChannel(guildId, categoryId, name, permissions = []) {
    if (!guildId || !categoryId) return null;

    try {
        const response = await fetch(`${DISCORD_API_URL}/guilds/${guildId}/channels`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                type: 0, // 0 = GUILD_TEXT
                parent_id: categoryId,
                permission_overwrites: permissions
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Discord API Error:', error);
            throw new Error(`Failed to create channel: ${error.message}`);
        }

        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error('Create Channel Error:', error);
        return null;
    }
}

// Permission Helper
// Allow: View Channel (1024), Send Messages (2048)
// Deny: View Channel (1024)
export const PERMISSIONS = {
    VIEW_CHANNEL: 1024,
    SEND_MESSAGES: 2048,
    READ_MESSAGE_HISTORY: 65536
};
