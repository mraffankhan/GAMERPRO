'use server';

import { createDiscordCategory, createDiscordChannel, PERMISSIONS } from '@/utils/discord';
import { supabase } from '@/lib/supabase-auth'; // Note: This might need a service role client for some actions, but for now assuming auth flow or env vars.
// Actually, for Server Actions, we should use a Service Role client if we want to bypass RLS, but for Discord actions we just need the Env Vars.

export async function createTournamentDiscordCategory(tournamentId, tournamentName) {
    if (!process.env.DISCORD_GUILD_ID) {
        return { success: false, error: 'Discord Guild ID not configured.' };
    }

    const categoryId = await createDiscordCategory(process.env.DISCORD_GUILD_ID, tournamentName);

    if (categoryId) {
        // Save to DB (We can do this here using a service role client, or return ID to client)
        // Better to limit client-side DB updates for internal IDs.
        return { success: true, categoryId };
    }
    return { success: false, error: 'Failed to create Discord Category' };
}

export async function generateGroupChannels(categoryId, groups) {
    // groups = [{ id, name }]
    if (!process.env.DISCORD_GUILD_ID || !categoryId) {
        return { success: false, error: 'Missing Configuration' };
    }

    const results = [];
    const VIEW_CHANNEL = PERMISSIONS.VIEW_CHANNEL;

    for (const group of groups) {
        try {
            // Private Channel: @everyone DENY View, Specific Roles/Users ALLOW
            const perms = [
                {
                    id: process.env.DISCORD_GUILD_ID, // @everyone
                    type: 0, // Role
                    deny: VIEW_CHANNEL,
                    allow: 0
                }
                // We would add specific users here if we had their Discord IDs mapping
            ];

            const channelId = await createDiscordChannel(
                process.env.DISCORD_GUILD_ID,
                categoryId,
                group.name.toLowerCase().replace(/\s+/g, '-'),
                perms
            );

            if (channelId) {
                results.push({ groupId: group.id, channelId });
            }
        } catch (e) {
            console.error(`Failed to create channel for ${group.name}`, e);
        }
    }

    return { success: true, results };
}

// Helper for single channel if needed
export async function createGroupChannelAction(categoryId, groupName) {
    if (!process.env.DISCORD_GUILD_ID) return null;
    return await createDiscordChannel(process.env.DISCORD_GUILD_ID, categoryId, groupName);
}
