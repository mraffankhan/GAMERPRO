'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const router = useRouter();
    const [message, setMessage] = useState('');

    // Form States
    const [tournament, setTournament] = useState({ name: '', game: '', prize: '', start_date: '', image_url: '' });
    const [team, setTeam] = useState({ name: '', wins: 0, members_count: 5, logo_url: '' });
    const [creator, setCreator] = useState({ name: '', platform: '', followers: '', avatar_url: '', role: 'Streamer' });

    // Handlers
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

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>Admin Dashboard</h1>
            <p style={{ color: '#aaa', marginBottom: '24px' }}>Manage platform content.</p>

            {/* Super Admin Link */}
            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/super">
                    <button style={{ padding: '8px 16px', background: '#333', border: '1px solid #444', borderRadius: '6px', color: '#888', cursor: 'pointer' }}>
                        Go to Super Admin Panel
                    </button>
                </Link>
            </div>

            {message && <div style={{ padding: '12px', background: message.includes('Error') ? '#7f1d1d' : '#065f46', borderRadius: '8px', marginBottom: '24px' }}>{message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>

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
        </div>
    );
}
