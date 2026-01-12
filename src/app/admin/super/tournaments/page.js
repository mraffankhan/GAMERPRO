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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <Link href="/admin/super" style={{ color: '#aaa', textDecoration: 'none' }}>&larr; Back</Link>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Tournaments</h1>
            </div>

            {/* Create Form */}
            <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '24px', borderRadius: '16px', marginBottom: '48px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#34d399' }}>Create New Tournament</h2>
                {message && <p style={{ marginBottom: '12px', color: message.includes('Error') ? 'red' : '#34d399' }}>{message}</p>}
                <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Game" value={formData.game} onChange={e => setFormData({ ...formData, game: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Prize" value={formData.prize} onChange={e => setFormData({ ...formData, prize: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Start Date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Image URL" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} style={inputStyle} />
                    <button type="submit" style={btnStyle}>Create</button>
                </form>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {tournaments.map(t => (
                    <div key={t.id} style={{ background: '#222', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                        {t.image_url && <img src={t.image_url} alt={t.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />}
                        <div style={{ padding: '16px' }}>
                            <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t.name}</h3>
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>{t.game} • {t.prize}</p>
                            <button onClick={() => handleDelete(t.id)} style={{ marginTop: '12px', padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const inputStyle = { padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' };
const btnStyle = { padding: '10px', background: '#34d399', border: 'none', borderRadius: '6px', color: '#111', fontWeight: 'bold', cursor: 'pointer' };
