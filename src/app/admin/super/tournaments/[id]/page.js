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
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', data: null });

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch Tournament
        const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single();
        setTournament(t);

        // Fetch Registrations with Team details
        const { data: regs } = await supabase
            .from('tournament_registrations')
            .select('*, teams(*)')
            .eq('tournament_id', id);
        setRegistrations(regs || []);

        // Fetch Groups with Teams
        const { data: grps } = await supabase
            .from('groups')
            .select('*, group_teams(*, teams(*))')
            .eq('tournament_id', id)
            .order('name', { ascending: true });
        setGroups(grps || []);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Generate Groups Logic
    const handleGenerateGroups = async () => {
        if (registrations.length === 0) {
            setActionMessage('No teams registered. Cannot generate groups.');
            return;
        }

        setActionMessage('Generating groups...');
        const GROUP_SIZE = 12;
        const stageName = tournament.stages?.[0] || 'Qualifiers';

        // Shuffle teams (Fisher-Yates)
        const teamIds = registrations.map(r => r.team_id);
        for (let i = teamIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
        }

        // Split into chunks of 12
        const chunks = [];
        for (let i = 0; i < teamIds.length; i += GROUP_SIZE) {
            chunks.push(teamIds.slice(i, i + GROUP_SIZE));
        }

        try {
            // Delete existing groups for this tournament (reset)
            await supabase.from('groups').delete().eq('tournament_id', id);

            // Create new groups
            for (let i = 0; i < chunks.length; i++) {
                const groupName = chunks[i].length < GROUP_SIZE ? 'Wildcard' : `Group ${String.fromCharCode(65 + i)}`;

                // Insert group
                const { data: newGroup, error: gError } = await supabase
                    .from('groups')
                    .insert({ tournament_id: id, stage_name: stageName, name: groupName })
                    .select()
                    .single();

                if (gError) throw gError;

                // Insert group_teams
                const groupTeams = chunks[i].map(teamId => ({
                    group_id: newGroup.id,
                    team_id: teamId
                }));

                const { error: gtError } = await supabase.from('group_teams').insert(groupTeams);
                if (gtError) throw gtError;
            }

            setActionMessage(`Successfully created ${chunks.length} groups!`);
            fetchData(); // Refresh
        } catch (err) {
            console.error(err);
            setActionMessage(`Error: ${err.message}`);
        }
    };

    // Disqualify Team
    const handleDisqualify = async (registrationId, teamName) => {
        setConfirmModal({ show: true, type: 'disqualify', data: { registrationId, teamName } });
    };

    const confirmDisqualify = async () => {
        const { registrationId } = confirmModal.data;
        setConfirmModal({ show: false, type: '', data: null });

        try {
            await supabase.from('tournament_registrations').delete().eq('id', registrationId);
            setActionMessage('Team disqualified successfully.');
            fetchData();
        } catch (err) {
            setActionMessage(`Error: ${err.message}`);
        }
    };

    if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading details...</div>;
    if (!tournament) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Tournament not found.</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff', paddingBottom: '80px' }}>
            {/* Confirm Modal */}
            {confirmModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', color: '#fff' }}>Confirm Disqualification</h3>
                        <p style={{ color: '#888', marginBottom: '24px' }}>Remove <strong style={{ color: '#fff' }}>{confirmModal.data?.teamName}</strong> from this tournament?</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setConfirmModal({ show: false, type: '', data: null })} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #444', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button onClick={confirmDisqualify} style={{ padding: '12px 24px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>Disqualify</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '32px' }}>
                <Link href="/admin/super/tournaments" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(10, 10, 10, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '100px', color: '#fff', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}>← Back</div>
                </Link>
            </div>

            {/* Action Message */}
            {actionMessage && (
                <div style={{ padding: '16px', marginBottom: '24px', borderRadius: '8px', background: actionMessage.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)', color: actionMessage.includes('Error') ? '#ef4444' : '#34d399', fontWeight: '500' }}>
                    {actionMessage}
                </div>
            )}

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

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleGenerateGroups} style={{ padding: '12px 24px', background: '#34d399', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                        Generate Groups
                    </button>
                </div>
            </div>

            {/* Groups Section (if generated) */}
            {groups.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Generated Groups</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {groups.map(g => (
                            <div key={g.id} style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: g.name === 'Wildcard' ? '#f59e0b' : '#fff' }}>{g.name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#666', background: '#222', padding: '4px 8px', borderRadius: '4px' }}>{g.group_teams?.length || 0} Teams</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {g.group_teams?.map(gt => (
                                        <div key={gt.id} style={{ padding: '10px 12px', background: '#111', borderRadius: '6px', fontSize: '0.9rem', color: '#ccc' }}>
                                            {gt.teams?.name || 'Unknown'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                                        <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
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
                                                <button onClick={() => handleDisqualify(r.id, r.teams?.name)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>Disqualify</button>
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
