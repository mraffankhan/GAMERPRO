'use client';

import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px' }}>Admin Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Content Management Card */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Content Management</h2>
                    <p style={{ color: '#aaa', marginBottom: '24px' }}>Manage tournaments, teams, and creators.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button style={{ padding: '12px', background: '#333', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
                            Manage Tournaments (Coming Soon)
                        </button>
                        <button style={{ padding: '12px', background: '#333', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
                            Manage Teams (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* Super Admin Link */}
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#818cf8' }}>Super Admin Zone</h2>
                    <p style={{ color: '#aaa', marginBottom: '24px' }}>Manage administrators and platform settings.</p>
                    <Link href="/admin/super">
                        <button style={{ padding: '12px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                            Go to Super Admin Panel
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
