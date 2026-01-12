'use client';

import { supabase } from '../../lib/supabase-auth';
import styles from './page.module.css';

export default function LoginPage() {
    const handleDiscordLogin = async () => {
        if (!supabase) {
            alert('Discord login not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
            return;
        }
        await supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
                scopes: 'guilds.join',
            },
        });
    };

    return (
        <main className={styles.container}>
            <div className={`glass-panel ${styles.card}`}>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Sign in to access tournaments & teams</p>

                <button onClick={handleDiscordLogin} className={styles.discordBtn}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.icon}>
                        <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.621-.369 1.283-.5 1.645a15.405 15.405 0 0 0-4.633 0c-.141-.373-.322-1.024-.5-1.645a16.297 16.297 0 0 0-4.126 1.3C3.514 8.236 2.65 13.437 2.964 18.578a16.488 16.488 0 0 0 5.06 2.562c.983-1.34 1.879-2.774 2.628-4.298a10.666 10.666 0 0 1-1.636-.786c.15-.107.296-.217.439-.333 3.25 1.503 6.776 1.503 9.997 0 .144.116.29.223.442.333-.532.285-1.082.55-1.639.786.752 1.523 1.649 2.955 2.631 4.298a16.487 16.487 0 0 0 5.066-2.562c.381-5.698-.829-10.342-2.011-13.022ZM8.625 14.767c-1.002 0-1.831-.92-1.831-2.046 0-1.127.818-2.046 1.831-2.046 1.023 0 1.841.92 1.831 2.046 0 1.126-.807 2.046-1.831 2.046Zm6.75 0c-1.002 0-1.831-.92-1.831-2.046 0-1.127.819-2.046 1.831-2.046 1.023 0 1.841.92 1.831 2.046 0 1.126-.808 2.046-1.831 2.046Z" fill="white" />
                    </svg>
                    Login with Discord
                </button>
            </div>
        </main>
    );
}
