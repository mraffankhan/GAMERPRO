'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role !== 'super_admin') { router.replace('/admin'); return; }
            fetchUsers();
        };
        checkAuth();
    }, [router]);

    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
        setLoading(false);
    };

    const updateUserRole = async (userId, newRole) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) fetchUsers();
        else alert('Failed to update role');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/super" style={{ textDecoration: 'none' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: '#333',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s'
                    }}>
                        &larr; Back to Hub
                    </button>
                </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Manage Users</h1>
                <span style={{ color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.9rem' }}>{users.length} Total</span>
            </div>

            <div style={{ background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                            <th style={{ padding: '24px', borderBottom: '1px solid #333', fontSize: '0.9rem', color: '#888', fontWeight: '500' }}>USER DETAIL</th>
                            <th style={{ padding: '24px', borderBottom: '1px solid #333', fontSize: '0.9rem', color: '#888', fontWeight: '500' }}>CURRENT ROLE</th>
                            <th style={{ padding: '24px', borderBottom: '1px solid #333', fontSize: '0.9rem', color: '#888', fontWeight: '500' }}>CHANGE ROLE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {user.avatar_url && <img src={user.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                                        <span>{user.username || 'Unknown User'}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>{user.id}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        background: user.role === 'super_admin' ? '#4f46e5' : user.role === 'admin' ? '#10b981' : '#333'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <select
                                        value={user.role}
                                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                                        style={{ background: '#222', color: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #444' }}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
