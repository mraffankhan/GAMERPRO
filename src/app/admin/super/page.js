'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminHub() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSuperAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile?.role !== 'super_admin') {
                router.replace('/admin');
                return;
            }
            setLoading(false);
        };
        checkSuperAdmin();
    }, [router]);

    if (loading) return <div>Loading Hub...</div>;

    const cards = [
        { title: 'Tournaments', desc: 'Create & Manage Tournaments', href: '/admin/super/tournaments', color: '#34d399' },
        { title: 'Teams', desc: 'Manage Teams & Rosters', href: '/admin/super/teams', color: '#60a5fa' },
        { title: 'Creators', desc: 'Manage Streamers & Influencers', href: '/admin/super/creators', color: '#f472b6' },
        { title: 'Users', desc: 'Promote/Demote Admins', href: '/admin/super/users', color: '#818cf8' },
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Super Admin Hub</h1>
                <span style={{ padding: '8px 16px', background: '#4f46e5', borderRadius: '100px', fontSize: '0.9rem' }}>SUPER ACCESS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                {cards.map((card) => (
                    <Link href={card.href} key={card.title} style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '32px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            height: '100%'
                        }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: card.color }}>{card.title}</h2>
                            <p style={{ color: '#aaa' }}>{card.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
