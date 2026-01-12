import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

        // Auto-join Discord Server
        if (session?.provider_token && session?.user?.user_metadata?.provider_id) {
            try {
                const guildId = '1449085445593108615';
                const discordUserId = session.user.user_metadata.provider_id;
                const botToken = process.env.DISCORD_BOT_TOKEN;

                if (botToken) {
                    await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bot ${botToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            access_token: session.provider_token,
                        }),
                    });
                } else {
                    console.error('DISCORD_BOT_TOKEN not found');
                }
            } catch (error) {
                console.error('Failed to auto-join Discord server:', error);
            }
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin);
}
