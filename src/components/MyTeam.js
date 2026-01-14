'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './MyTeam.module.css';

const MAX_TEAM_SIZE = 4;

export default function MyTeam() {
    const [user, setUser] = useState(null);
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [isCaptain, setIsCaptain] = useState(false);
    const [invites, setInvites] = useState([]); // Pending invites for the user
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [sentInvites, setSentInvites] = useState([]); // Track user IDs we've invited

    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('initial'); // initial, create
    const [formData, setFormData] = useState({ name: '' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [leaveModal, setLeaveModal] = useState(false);

    useEffect(() => {
        checkUserAndTeam();
    }, []);

    const checkUserAndTeam = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }
        setUser(session.user);

        // Check if user is in a team
        const { data: memberData } = await supabase
            .from('team_members')
            .select('team_id, role, joined_at, teams(*)')
            .eq('user_id', session.user.id)
            .single();

        if (memberData && memberData.teams) {
            setTeam(memberData.teams);
            setIsCaptain(memberData.role === 'captain');
            fetchMembers(memberData.team_id);
        } else {
            // Fetch invites if not in team
            fetchInvites(session.user.id);
        }
        setLoading(false);
    };

    const fetchMembers = async (teamId) => {
        const { data } = await supabase
            .from('team_members')
            .select('role, user_id, profiles(username, avatar_url)')
            .eq('team_id', teamId);
        if (data) setMembers(data);
    };

    const fetchInvites = async (userId) => {
        const { data } = await supabase
            .from('team_invites')
            .select('id, status, team_id, teams(name, logo_url)')
            .eq('user_id', userId)
            .eq('status', 'pending');
        if (data) setInvites(data);
    };

    // --- Actions ---

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');

        // Generate unique code
        let code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // 1. Create Team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert([{
                name: formData.name,
                // logo_url removed
                join_code: code,
                members_count: 1
            }])
            .select()
            .single();

        if (teamError) {
            setError(teamError.message);
            return;
        }

        // 2. Add creator as member
        const { error: memberError } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamData.id,
                user_id: user.id,
                role: 'captain'
            }]);

        if (memberError) {
            setError('Team created but failed to join instantly. Please verify.');
        } else {
            setTeam(teamData);
            fetchMembers(teamData.id);
            setView('initial');
        }
    };



    const handleLeave = async () => {
        await supabase
            .from('team_members')
            .delete()
            .eq('user_id', user.id);

        if (team) {
            await supabase
                .from('teams')
                .update({ members_count: team.members_count - 1 })
                .eq('id', team.id);
        }

        setTeam(null);
        setMembers([]);
        setLeaveModal(false);
        // Re-check invites
        fetchInvites(user.id);
    };

    // --- Search & Invite ---

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length === 0) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .ilike('username', `%${searchQuery}%`)
                .limit(5);

            setSearchResults(data || []);
            setSearchLoading(false);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleInviteUser = async (targetUserId) => {
        setSuccessMsg('');
        const { error } = await supabase
            .from('team_invites')
            .insert([{
                team_id: team.id,
                user_id: targetUserId
            }]);

        if (error) {
            if (error.code === '23505') alert('User already invited or pending.');
            else alert(error.message);
        } else {
            // Add to sentInvites to show Sent badge
            setSentInvites(prev => [...prev, targetUserId]);
        }
    };

    const handleAcceptInvite = async (invite) => {
        // Fetch full team details using team_id from invite
        const { data: fullTeam } = await supabase.from('teams').select('*').eq('id', invite.team_id).single();

        if (!fullTeam) {
            alert('Error: Could not find team');
            return;
        }

        // Check if team is full (4 players max)
        if (fullTeam.members_count >= MAX_TEAM_SIZE) {
            alert(`Team is full (${MAX_TEAM_SIZE}/${MAX_TEAM_SIZE} players)`);
            return;
        }

        // Update invite status
        await supabase
            .from('team_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id);

        // Insert as team member
        const { error: joinError } = await supabase.from('team_members').insert([{
            team_id: fullTeam.id,
            user_id: user.id,
            role: 'member'
        }]);

        if (joinError) {
            if (joinError.code === '23505') alert('You are already in a team.');
            else alert(joinError.message);
            return;
        }

        // Update count
        await supabase.from('teams').update({ members_count: fullTeam.members_count + 1 }).eq('id', fullTeam.id);

        setTeam(fullTeam);
        setIsCaptain(false); // Joining as member
        fetchMembers(fullTeam.id);
        setInvites([]); // Clear invites
    };

    useEffect(() => {
        if (user && !team) fetchInvites(user.id);
    }, [user, team]);


    if (loading) return null;

    if (!user) return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <h3>Join the Competition</h3>
                    <p style={{ marginTop: '1rem', color: '#888' }}>Log in to create or join a team.</p>
                </div>
            </div>
        </section>
    );

    if (team) {
        return (
            <section className={styles.section}>
                {/* Leave Team Modal */}
                {leaveModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', color: '#fff' }}>Leave Team</h3>
                            <p style={{ color: '#888', marginBottom: '24px', lineHeight: '1.5' }}>
                                Are you sure you want to leave <strong style={{ color: '#fff' }}>{team.name}</strong>? You will need an invite to rejoin.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setLeaveModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'transparent',
                                        border: '1px solid #444',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeave}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#ef4444',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    Leave Team
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>My Team</h2>
                    </div>
                    <div className={styles.card} style={{ maxWidth: '800px' }}>
                        <div className={styles.teamHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {/* Logo removed/optional- if it exists show it, else placeholder */}
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                    {team.logo_url ? <img src={team.logo_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : team.name[0]}
                                </div>
                                <div>
                                    <div className={styles.teamName}>{team.name}</div>
                                    <div style={{ color: '#888', fontSize: '0.9rem' }}>{members.length} Members</div>
                                </div>
                            </div>
                            <div className={styles.codeBox}>
                                <span>Code:</span>
                                <strong>{team.join_code}</strong>
                            </div>
                        </div>

                        <div className={styles.membersList}>
                            {members.map(m => (
                                <div key={m.user_id} className={styles.member}>
                                    <div className={styles.avatar}>
                                        {m.profiles?.avatar_url ? (
                                            <img src={m.profiles.avatar_url} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#555' }} />
                                        )}
                                    </div>
                                    <div className={styles.memberName}>{m.profiles?.username || 'Unknown'}</div>
                                    <div className={styles.memberRole}>{m.role}</div>
                                </div>
                            ))}
                        </div>

                        {/* Search & Invite Section - Captain Only */}
                        {isCaptain && members.length < MAX_TEAM_SIZE && (
                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #333' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'white' }}>Invite Players</h4>
                                <div style={{ marginBottom: '1rem' }}>
                                    <input
                                        className={styles.input}
                                        placeholder="Type to search users..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchLoading && <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>Searching...</div>}
                                </div>

                                {searchResults.length > 0 && (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {searchResults.map(p => (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#222', padding: '10px', borderRadius: '8px' }}>
                                                <span style={{ color: 'white' }}>{p.username}</span>
                                                {/* Don't allow inviting existing members */}
                                                {members.find(m => m.user_id === p.id) ? (
                                                    <span style={{ color: '#666', fontSize: '0.8rem' }}>Joined</span>
                                                ) : sentInvites.includes(p.id) ? (
                                                    <span style={{ color: '#34d399', fontSize: '0.8rem' }}>Sent</span>
                                                ) : (
                                                    <button onClick={() => handleInviteUser(p.id)} style={{ background: '#4f46e5', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                                        Invite
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Team Full Message */}
                        {members.length >= MAX_TEAM_SIZE && (
                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #333', textAlign: 'center' }}>
                                <span style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '8px 16px', borderRadius: '8px' }}>
                                    ✓ Team Complete ({MAX_TEAM_SIZE}/{MAX_TEAM_SIZE} Players)
                                </span>
                            </div>
                        )}

                        <button onClick={() => setLeaveModal(true)} style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                            Leave Team
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Team Management</h2>
                    <p className={styles.subtitle}>Create your legacy or join forces.</p>
                </div>

                {/* Invites Section */}
                {invites.length > 0 && (
                    <div className={styles.card} style={{ marginBottom: '2rem', border: '1px solid #4f46e5' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#4f46e5' }}>Team Invites</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {invites.map(inv => (
                                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{inv.teams?.name}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAcceptInvite(inv)}
                                        className={`${styles.btn} ${styles.btnPrimary}`}
                                        style={{ fontSize: '0.85rem', padding: '6px 16px' }}
                                    >
                                        Accept
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'initial' && (
                    <div className={styles.card}>
                        <p style={{ marginBottom: '2rem', color: '#ccc' }}>You are not in a team yet.</p>
                        <p style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>Create a team to become captain, or wait for an invite from a team captain.</p>
                        <div className={styles.actions}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setView('create')}>Create Team</button>
                        </div>
                    </div>
                )}

                {view === 'create' && (
                    <div className={styles.card}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Create New Team</h3>
                        <form onSubmit={handleCreate} className={styles.form}>
                            <input
                                className={styles.input}
                                placeholder="Team Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            {/* Logo URL input removed */}
                            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                            <div className={styles.actions}>
                                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setView('initial')}>Cancel</button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Create</button>
                            </div>
                        </form>
                    </div>
                )}


            </div>
        </section>
    );
}
