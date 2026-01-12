'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';

export default function SuperAdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const router = useRouter();

    // Form States
    const [tournament, setTournament] = useState({ name: '', game: '', prize: '', start_date: '', image_url: '' });
    const [team, setTeam] = useState({ name: '', wins: 0, members_count: 5, logo_url: '' });
    const [creator, setCreator] = useState({ name: '', platform: '', followers: '', avatar_url: '', role: 'Streamer' });

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

    // Creation Handlers
    const handleCreateTournament = async (e) => {
        e.preventDefault();
        setMessage('Creating Tournament...');
        const { error } = await supabase.from('tournaments').insert([tournament]);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Tournament Created!');
            setTournament({ name: '', game: '', prize: '', start_date: '', image_url: '' });
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setMessage('Creating Team...');
        const { error } = await supabase.from('teams').insert([team]);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Team Created!');
            setTeam({ name: '', wins: 0, members_count: 5, logo_url: '' });
        }
    };

    const handleCreateCreator = async (e) => {
        e.preventDefault();
        setMessage('Creating Creator...');
        const { error } = await supabase.from('creators').insert([creator]);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Creator Added!');
            setCreator({ name: '', platform: '', followers: '', avatar_url: '', role: 'Streamer' });
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        background: '#222',
        border: '1px solid #444',
        borderRadius: '6px',
        color: '#fff',
        marginBottom: '12px'
    };

    const btnStyle = {
        padding: '10px 20px',
        background: '#10b981',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 'bold'
    };

    if (loading) return <div>Loading Super Admin Panel...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Super Admin Panel</h1>
                <span style={{ padding: '8px 12px', background: '#4f46e5', borderRadius: '100px', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>SUPER ADMIN ACCESS ONLY</span>
            </div>

            {message && <div style={{ padding: '12px', background: message.includes('Error') ? '#7f1d1d' : '#065f46', borderRadius: '8px', marginBottom: '32px' }}>{message}</div>}

            {/* Creation Forms Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                {/* Create Tournament */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#34d399' }}>Create Tournament</h2>
                    <form onSubmit={handleCreateTournament}>
                        <input type="text" placeholder="Tournament Name" style={inputStyle} value={tournament.name} onChange={e => setTournament({ ...tournament, name: e.target.value })} required />
                        <input type="text" placeholder="Game (e.g. Valorant)" style={inputStyle} value={tournament.game} onChange={e => setTournament({ ...tournament, game: e.target.value })} required />
                        <input type="text" placeholder="Prize Pool (e.g. $10,000)" style={inputStyle} value={tournament.prize} onChange={e => setTournament({ ...tournament, prize: e.target.value })} required />
                        <input type="text" placeholder="Start Date (e.g. Feb 20, 2026)" style={inputStyle} value={tournament.start_date} onChange={e => setTournament({ ...tournament, start_date: e.target.value })} required />
                        <input type="text" placeholder="Image URL (Optional)" style={inputStyle} value={tournament.image_url} onChange={e => setTournament({ ...tournament, image_url: e.target.value })} />
                        <button type="submit" style={btnStyle}>Create Tournament</button>
                    </form>
                </div>

                {/* Create Team */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#60a5fa' }}>Add Team</h2>
                    <form onSubmit={handleCreateTeam}>
                        <input type="text" placeholder="Team Name" style={inputStyle} value={team.name} onChange={e => setTeam({ ...team, name: e.target.value })} required />
                        <input type="number" placeholder="Wins" style={inputStyle} value={team.wins} onChange={e => setTeam({ ...team, wins: parseInt(e.target.value) })} required />
                        <input type="number" placeholder="Members Count" style={inputStyle} value={team.members_count} onChange={e => setTeam({ ...team, members_count: parseInt(e.target.value) })} required />
                        <input type="text" placeholder="Logo URL (Optional)" style={inputStyle} value={team.logo_url} onChange={e => setTeam({ ...team, logo_url: e.target.value })} />
                        <button type="submit" style={{ ...btnStyle, background: '#3b82f6' }}>Add Team</button>
                    </form>
                </div>

                {/* Create Creator */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#f472b6' }}>Add Creator</h2>
                    <form onSubmit={handleCreateCreator}>
                        <input type="text" placeholder="Creator Name" style={inputStyle} value={creator.name} onChange={e => setCreator({ ...creator, name: e.target.value })} required />
                        <input type="text" placeholder="Platform (Twitch/YouTube)" style={inputStyle} value={creator.platform} onChange={e => setCreator({ ...creator, platform: e.target.value })} required />
                        <input type="text" placeholder="Followers (e.g. 1.2M)" style={inputStyle} value={creator.followers} onChange={e => setCreator({ ...creator, followers: e.target.value })} required />
                        <input type="text" placeholder="Role (Streamer, Analyst)" style={inputStyle} value={creator.role} onChange={e => setCreator({ ...creator, role: e.target.value })} />
                        <input type="text" placeholder="Avatar URL (Optional)" style={inputStyle} value={creator.avatar_url} onChange={e => setCreator({ ...creator, avatar_url: e.target.value })} />
                        <button type="submit" style={{ ...btnStyle, background: '#db2777' }}>Add Creator</button>
                    </form>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', borderTop: '1px solid #333', paddingTop: '32px' }}>User Management</h2>

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
