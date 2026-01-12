'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TournamentManager() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({ name: '', game: '', prize: '', start_date: '', image_url: '' });
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role !== 'super_admin') { router.replace('/admin'); return; }
            fetchTournaments();
        };
        checkAuth();
    }, [router]);

    const fetchTournaments = async () => {
        const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
        if (data) setTournaments(data);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage('Creating...');
        const { error } = await supabase.from('tournaments').insert([formData]);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Success!');
            setFormData({ name: '', game: '', prize: '', start_date: '', image_url: '' });
            fetchTournaments();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await supabase.from('tournaments').delete().eq('id', id);
        fetchTournaments();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/super" style={{
                    textDecoration: 'none',
                    color: '#888',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'color 0.2s'
                }}
                    onMouseOver={(e) => e.target.style.color = '#fff'}
                    onMouseOut={(e) => e.target.style.color = '#888'}
                >
                    &larr; Back
                </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Manage Tournaments</h1>
                <span style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.9rem' }}>{tournaments.length} Active</span>
            </div>

            {/* Create Form */}
            <div style={{ background: '#1a1a1a', padding: '32px', borderRadius: '16px', marginBottom: '48px', border: '1px solid #333' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>Create New Tournament</h2>
                <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>Fill in the details below to launch a new tournament.</p>

                {message && <div style={{ padding: '12px', background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.includes('Error') ? '#ef4444' : '#10b981', borderRadius: '8px', marginBottom: '24px' }}>{message}</div>}

                <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Tournament Name</label>
                        <input type="text" placeholder="e.g. Winter Championship 2026" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Game Title</label>
                        <input type="text" placeholder="e.g. Valorant" value={formData.game} onChange={e => setFormData({ ...formData, game: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Prize Pool</label>
                        <input type="text" placeholder="e.g. $10,000" value={formData.prize} onChange={e => setFormData({ ...formData, prize: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Start Date</label>
                        <input type="text" placeholder="e.g. Feb 20, 2026" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Cover Image URL</label>
                        <input type="text" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                        <button type="submit" style={btnStyle}>Create Tournament</button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {tournaments.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#666', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>No tournaments found. Create one above!</div>
                ) : tournaments.map(t => (
                    <div key={t.id} style={{ background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', border: '1px solid #333', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
                        {t.image_url ? (
                            <img src={t.image_url} alt={t.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '180px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>No Image</div>
                        )}
                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>{t.name}</h3>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#aaa', marginBottom: '20px', flex: 1 }}>
                                <span style={{ background: '#222', padding: '4px 8px', borderRadius: '4px', height: 'fit-content' }}>{t.game}</span>
                                <span style={{ background: '#222', padding: '4px 8px', borderRadius: '4px', color: '#34d399', height: 'fit-content' }}>{t.prize}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '16px', marginTop: 'auto' }}>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                                <button onClick={() => handleDelete(t.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '8px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' };
const btnStyle = { padding: '12px 24px', background: '#34d399', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', width: '100%' };
