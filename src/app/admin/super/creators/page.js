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
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Manage Creators</h1>
                <span style={{ color: '#f472b6', background: 'rgba(244, 114, 182, 0.1)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.9rem' }}>{creators.length} Active</span>
            </div>

            {/* Create Form */}
            <div style={{ background: '#1a1a1a', padding: '32px', borderRadius: '16px', marginBottom: '48px', border: '1px solid #333' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>Add New Creator</h2>
                <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>Add a new content creator to the platform network.</p>

                {message && <div style={{ padding: '12px', background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(244, 114, 182, 0.1)', color: message.includes('Error') ? '#ef4444' : '#f472b6', borderRadius: '8px', marginBottom: '24px' }}>{message}</div>}

                <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Creator Name</label>
                        <input type="text" placeholder="e.g. Shroud" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Platform</label>
                        <input type="text" placeholder="e.g. Twitch" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Followers</label>
                        <input type="text" placeholder="e.g. 10.5M" value={formData.followers} onChange={e => setFormData({ ...formData, followers: e.target.value })} style={inputStyle} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Role</label>
                        <input type="text" placeholder="e.g. Streamer" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Avatar URL</label>
                        <input type="text" placeholder="https://..." value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                        <button type="submit" style={btnStyle}>Add Creator</button>
                    </div>
                </form>
            </div>

            {/* List */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 'bold' }}>All Creators</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                {creators.map(c => (
                    <div key={c.id} style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', border: '1px solid #333', textAlign: 'center', transition: 'transform 0.2s' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#222', margin: '0 auto 16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #333' }}>
                            {c.avatar_url ? (
                                <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '2rem', color: '#444' }}>#</span>
                            )}
                        </div>
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px', color: '#fff' }}>{c.name}</h3>
                        <p style={{ color: '#f472b6', fontSize: '0.9rem', marginBottom: '8px' }}>{c.role}</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px', fontSize: '0.85rem', color: '#aaa' }}>
                            <span>{c.platform}</span>
                            <span>•</span>
                            <span>{c.followers} Followers</span>
                        </div>

                        <button onClick={() => handleDelete(c.id)} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '8px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' };
const btnStyle = { padding: '12px 24px', background: '#f472b6', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', width: '100%' };
