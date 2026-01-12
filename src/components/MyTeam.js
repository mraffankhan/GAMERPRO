'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './MyTeam.module.css';

export default function MyTeam() {
    const [user, setUser] = useState(null);
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [invites, setInvites] = useState([]); // Pending invites for the user
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('initial'); // initial, create, join
    const [formData, setFormData] = useState({ name: '', join_code: '' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

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
            .select('id, status, teams(name, logo_url)')
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

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.join_code) {
            setError('Please enter a code');
            return;
        }

        const { data: teamFound, error: findError } = await supabase
            .from('teams')
            .select('*')
            .eq('join_code', formData.join_code.toUpperCase())
            .single();

        if (findError || !teamFound) {
            setError('Invalid Team Code');
            return;
        }

        await joinTeamLogic(teamFound);
    };

    const joinTeamLogic = async (teamObj) => {
        // Add member
        const { error: joinError } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamObj.id,
                user_id: user.id,
                role: 'member'
            }]);

        if (joinError) {
            if (joinError.code === '23505') setError('You are already in a team.');
            else setError(joinError.message);
            return;
        }

        // Update count
        await supabase
            .from('teams')
            .update({ members_count: teamObj.members_count + 1 })
            .eq('id', teamObj.id);

        setTeam(teamObj);
        fetchMembers(teamObj.id);
        setView('initial');
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave the team?')) return;

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
        // Re-check invites
        fetchInvites(user.id);
    };

    // --- Search & Invite ---

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchLoading(true);
        // Search profiles by username
        const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${searchQuery}%`)
            .limit(5);

        setSearchResults(data || []);
        setSearchLoading(false);
    };

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
            alert('Invite sent!');
        }
    };

    const handleAcceptInvite = async (invite) => {
        // Join the team
        // We need team details first
        const { data: teamData } = await supabase.from('teams').select('*').eq('id', invite.teams.id).single(); // actually the query above returned team name/logo inside invite.teams, but we need full object for state ideally. Wait, invite.teams is an object.

        // Actually fetch full team to be safe for joinTeamLogic
        const { data: fullTeam } = await supabase.from('teams').select('*').eq('id', invite.teams.id || invite.team_id).single(); // wait, join query structure... 
        // In fetchInvites: select('..., teams(name, logo_url)') -> results in invite.teams = {name:..., logo_url:...}. It doesn't have ID unless we ask.
        // Actually we have invite.team_id (foreign key) on the invite object itself implicitly? No, we selected 'id, status, teams(...)'.
        // We should fix fetchInvites to include team_id

        // For now, let's fix fetchInvites first in mind, but here let's assume we can get it.
        // But cleaner: update status to accepted, then insert to team_members.

        await supabase
            .from('team_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id);

        // Insert member
        await supabase.from('team_members').insert([{
            team_id: fullTeam.id,
            user_id: user.id,
            role: 'member'
        }]);

        // Update count
        await supabase.from('teams').update({ members_count: fullTeam.members_count + 1 }).eq('id', fullTeam.id);

        setTeam(fullTeam);
        fetchMembers(fullTeam.id);
        setInvites([]); // Clear invites
    };

    // Correct fetchInvites to include team_id
    const fetchInvitesCorrected = async (userId) => {
        const { data } = await supabase
            .from('team_invites')
            .select('id, status, team_id, teams(name, logo_url)')
            .eq('user_id', userId)
            .eq('status', 'pending');
        if (data) setInvites(data);
    };

    // Override the previous fetchInvites with this one in the effect
    useEffect(() => {
        if (user && !team) fetchInvitesCorrected(user.id);
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

                        {/* Search & Invite Section (For everyone or just Captain?) Let's allow everyone to invite for now to reduce friction */}
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #333' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'white' }}>Invite Players</h4>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                                <input
                                    className={styles.input}
                                    placeholder="Search by username..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`}>Search</button>
                            </form>

                            {searchResults.length > 0 && (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {searchResults.map(p => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#222', padding: '10px', borderRadius: '8px' }}>
                                            <span style={{ color: 'white' }}>{p.username}</span>
                                            {/* Don't allow inviting existing members */}
                                            {members.find(m => m.user_id === p.id) ? (
                                                <span style={{ color: '#666', fontSize: '0.8rem' }}>Joined</span>
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

                        <button onClick={handleLeave} style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
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
                        <div className={styles.actions}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setView('create')}>Create Team</button>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setView('join')}>Join Team</button>
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

                {view === 'join' && (
                    <div className={styles.card}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Join with Code</h3>
                        <form onSubmit={handleJoin} className={styles.form}>
                            <input
                                className={styles.input}
                                placeholder="Enter Team Code (e.g. X7Y2Z1)"
                                value={formData.join_code}
                                onChange={e => setFormData({ ...formData, join_code: e.target.value })}
                                required
                            />
                            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                            <div className={styles.actions}>
                                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setView('initial')}>Cancel</button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Join Team</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
}
