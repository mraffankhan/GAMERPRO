'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeamManager() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({ name: '', wins: 0, members_count: 5, logo_url: '' });
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role !== 'super_admin') { router.replace('/admin'); return; }
            fetchTeams();
        };
        checkAuth();
    }, [router]);

    const fetchTeams = async () => {
        const { data } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
        if (data) setTeams(data);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage('Creating...');
        const { error } = await supabase.from('teams').insert([formData]);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Success!');
            setFormData({ name: '', wins: 0, members_count: 5, logo_url: '' });
            fetchTeams();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await supabase.from('teams').delete().eq('id', id);
        fetchTeams();
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
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Manage Teams</h1>
                <span style={{ color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.9rem' }}>{teams.length} Active</span>
            </div>

            {/* Create Form */}
            <div style={{ background: '#1a1a1a', padding: '32px', borderRadius: '16px', marginBottom: '48px', border: '1px solid #333' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>Add New Team</h2>
                <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>Register a new professional team to the roster.</p>

                {message && <div style={{ padding: '12px', background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(96, 165, 250, 0.1)', color: message.includes('Error') ? '#ef4444' : '#60a5fa', borderRadius: '8px', marginBottom: '24px' }}>{message}</div>}

                <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Team Name</label>
                        <input type="text" placeholder="e.g. Sentinels" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Total Wins</label>
                        <input type="number" placeholder="0" value={formData.wins} onChange={e => setFormData({ ...formData, wins: parseInt(e.target.value) })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Members Count</label>
                        <input type="number" placeholder="5" value={formData.members_count} onChange={e => setFormData({ ...formData, members_count: parseInt(e.target.value) })} style={inputStyle} required />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Logo URL</label>
                        <input type="text" placeholder="https://..." value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                        <button type="submit" style={btnStyle}>Add Team</button>
                    </div>
                </form>
            </div>

            {/* List */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 'bold' }}>All Teams</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
                {teams.map(t => (
                    <div key={t.id} style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', border: '1px solid #333', textAlign: 'center', transition: 'transform 0.2s' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#222', margin: '0 auto 16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #333' }}>
                            {t.logo_url ? (
                                <img src={t.logo_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '2rem', color: '#444' }}>#</span>
                            )}
                        </div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>{t.name}</h3>
                        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>{t.wins} Wins • {t.members_count} Members</p>
                        <button onClick={() => handleDelete(t.id)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Remove Team</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '8px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' };
const btnStyle = { padding: '12px 24px', background: '#60a5fa', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', width: '100%' };
