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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <Link href="/admin/super" style={{ color: '#aaa', textDecoration: 'none' }}>&larr; Back</Link>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Teams</h1>
            </div>

            {/* Create Form */}
            <div style={{ background: 'rgba(96, 165, 250, 0.1)', padding: '24px', borderRadius: '16px', marginBottom: '48px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#60a5fa' }}>Add New Team</h2>
                {message && <p style={{ marginBottom: '12px', color: message.includes('Error') ? 'red' : '#60a5fa' }}>{message}</p>}
                <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
                    <input type="number" placeholder="Wins" value={formData.wins} onChange={e => setFormData({ ...formData, wins: parseInt(e.target.value) })} style={inputStyle} required />
                    <input type="number" placeholder="Members Count" value={formData.members_count} onChange={e => setFormData({ ...formData, members_count: parseInt(e.target.value) })} style={inputStyle} required />
                    <input type="text" placeholder="Logo URL" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} style={inputStyle} />
                    <button type="submit" style={btnStyle}>Add Team</button>
                </form>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                {teams.map(t => (
                    <div key={t.id} style={{ background: '#222', borderRadius: '12px', padding: '16px', border: '1px solid #333', textAlign: 'center' }}>
                        {t.logo_url && <img src={t.logo_url} alt={t.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px', objectFit: 'cover' }} />}
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t.name}</h3>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>{t.wins} Wins • {t.members_count} Members</p>
                        <button onClick={() => handleDelete(t.id)} style={{ marginTop: '12px', padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const inputStyle = { padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' };
const btnStyle = { padding: '10px', background: '#60a5fa', border: 'none', borderRadius: '6px', color: '#111', fontWeight: 'bold', cursor: 'pointer' };
