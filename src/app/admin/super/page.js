'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';

export default function SuperAdminPanel() {
    const [users, setUsers] = useState([]);
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
                router.replace('/admin'); // Redirect normal admins back
                return;
            }

            fetchUsers();
        };

        checkSuperAdmin();
    }, [router]);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setUsers(data);
        setLoading(false);
    };

    const updateUserRole = async (userId, newRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            fetchUsers(); // Refresh list
        } else {
            alert('Failed to update role');
        }
    };

    if (loading) return <div>Loading Super Admin Panel...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Super Admin Panel</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/admin">
                        <button style={{ padding: '8px 16px', background: '#333', border: '1px solid #444', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                            Go to Content Mgmt
                        </button>
                    </Link>
                    <span style={{ padding: '8px 12px', background: '#4f46e5', borderRadius: '100px', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>SUPER ADMIN ACCESS ONLY</span>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <tr>
                            <th style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>User</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Role</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</th>
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
