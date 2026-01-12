'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatorManager() {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({ name: '', platform: '', followers: '', role: 'Streamer', avatar_url: '' });
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role !== 'super_admin') { router.replace('/admin'); return; }
            fetchCreators();
        };
        checkAuth();
    }, [router]);

    const fetchCreators = async () => {
        const { data } = await supabase.from('creators').select('*').order('created_at', { ascending: false });
        if (data) setCreators(data);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage('Creating...');
        const { error } = await supabase.from('creators').insert([formData]);
        if (error) setMessage(`Error: ${error.message}`);
        else {
            setMessage('Success!');
            setFormData({ name: '', platform: '', followers: '', role: 'Streamer', avatar_url: '' });
            fetchCreators();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await supabase.from('creators').delete().eq('id', id);
        fetchCreators();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <Link href="/admin/super" style={{ color: '#aaa', textDecoration: 'none' }}>&larr; Back</Link>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Manage Creators</h1>
            </div>

            {/* Create Form */}
            <div style={{ background: 'rgba(244, 114, 182, 0.1)', padding: '24px', borderRadius: '16px', marginBottom: '48px', border: '1px solid rgba(244, 114, 182, 0.2)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#f472b6' }}>Add New Creator</h2>
                {message && <p style={{ marginBottom: '12px', color: message.includes('Error') ? 'red' : '#f472b6' }}>{message}</p>}
                <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Platform" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Followers" value={formData.followers} onChange={e => setFormData({ ...formData, followers: e.target.value })} style={inputStyle} required />
                    <input type="text" placeholder="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Avatar URL" value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} style={inputStyle} />
                    <button type="submit" style={btnStyle}>Add Creator</button>
                </form>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                {creators.map(c => (
                    <div key={c.id} style={{ background: '#222', borderRadius: '12px', padding: '16px', border: '1px solid #333', textAlign: 'center' }}>
                        {c.avatar_url && <img src={c.avatar_url} alt={c.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px', objectFit: 'cover' }} />}
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{c.name}</h3>
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>{c.role} @ {c.platform}</p>
                        <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '4px' }}>{c.followers} Followers</p>
                        <button onClick={() => handleDelete(c.id)} style={{ marginTop: '12px', padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const inputStyle = { padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' };
const btnStyle = { padding: '10px', background: '#f472b6', border: 'none', borderRadius: '6px', color: '#111', fontWeight: 'bold', cursor: 'pointer' };
