'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-auth';

export default function AdminLayout({ children }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.replace('/login');
                return;
            }

            // Fetch profile to check role
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
                // Not authorized
                router.replace('/');
                return;
            }

            setLoading(false);
        };

        checkAdmin();
    }, [router]);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                Loading Admin Panel...
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', paddingTop: '100px', minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
            {children}
        </div>
    );
}
