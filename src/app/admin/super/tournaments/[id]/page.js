'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-auth';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TournamentDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [tournament, setTournament] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch Tournament
            const { data: t, error: tError } = await supabase.from('tournaments').select('*').eq('id', id).single();
            if (tError) {
                console.error(tError);
                // Handle error
            }
            setTournament(t);

            // Fetch Registrations with Team details
            const { data: regs, error: rError } = await supabase
                .from('tournament_registrations')
                .select('*, teams(*)')
                .eq('tournament_id', id);

            if (rError) console.error(rError);

            setRegistrations(regs || []);
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading details...</div>;
    if (!tournament) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Tournament not found.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff', paddingBottom: '80px' }}>
            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/super/tournaments" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(10, 10, 10, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '100px', color: '#fff', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s ease', cursor: 'pointer' }}>← Back</div>
                </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.1' }}>{tournament.name}</h1>
                    <div style={{ display: 'flex', gap: '16px', color: '#aaa', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%' }}></span>
                            {tournament.game}
                        </span>
                        <span style={{ background: '#333', width: '1px', height: '16px' }}></span>
                        <span>Max {tournament.max_teams} Teams</span>
                        <span style={{ background: '#333', width: '1px', height: '16px' }}></span>
                        <span style={{ color: '#34d399' }}>{tournament.prize} Prize Pool</span>
                    </div>
                </div>

                {/* Future: Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '12px 24px', background: '#34d399', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                        Generate Groups
                    </button>
                    <button style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                        Settings
                    </button>
                </div>
            </div>

            {/* Stages Section */}
            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Tournament Stages</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {(tournament.stages || ['Qualifiers', 'Quarter', 'Semi', 'Final', 'Grand Final']).map((s, i) => (
                        <div key={i} style={{ padding: '16px 24px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', minWidth: '140px' }}>
                            <span style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Stage {i + 1}</span>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Teams Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Registered Teams</h3>
                    <span style={{ padding: '6px 14px', background: '#222', borderRadius: '100px', fontSize: '0.9rem', color: registrations.length >= tournament.max_teams ? '#ef4444' : '#888' }}>
                        {registrations.length} / {tournament.max_teams} Registered
                    </span>
                </div>

                <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', overflow: 'hidden' }}>
                    {registrations.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                            No teams have registered for this tournament yet.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead style={{ background: '#111', color: '#666', fontSize: '0.8rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <tr>
                                        <th style={{ padding: '20px 24px', fontWeight: '600' }}>Team Name</th>
                                        <th style={{ padding: '20px 24px', fontWeight: '600' }}>Join Code</th>
                                        <th style={{ padding: '20px 24px', fontWeight: '600' }}>Registered At</th>
                                        <th style={{ padding: '20px 24px', fontWeight: '600' }}>Status</th>
                                        <th style={{ padding: '20px 24px', fontWeight: '600' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s', ':hover': { background: '#222' } }}>
                                            <td style={{ padding: '20px 24px', fontWeight: '600', color: '#fff' }}>
                                                {r.teams?.name || 'Unknown Team'}
                                            </td>
                                            <td style={{ padding: '20px 24px', color: '#aaa', fontFamily: 'monospace' }}>
                                                {r.teams?.join_code || '-'}
                                            </td>
                                            <td style={{ padding: '20px 24px', color: '#888' }}>
                                                {new Date(r.registered_at).toLocaleDateString()} <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{new Date(r.registered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span style={{ padding: '4px 10px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '500' }}>Qualified</span>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>Disqualify</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
