'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './MyTeam.module.css';

export default function MyTeam() {
    const [user, setUser] = useState(null);
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('initial'); // initial, create, join
    const [formData, setFormData] = useState({ name: '', logo_url: '', join_code: '' });
    const [error, setError] = useState('');

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
                logo_url: formData.logo_url,
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
            // Success
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

        // 1. Find team
        const { data: teamFound, error: findError } = await supabase
            .from('teams')
            .select('*')
            .eq('join_code', formData.join_code.toUpperCase()) // normalized
            .single();

        if (findError || !teamFound) {
            console.error(findError);
            setError('Invalid Team Code');
            return;
        }

        // 2. Add member
        const { error: joinError } = await supabase
            .from('team_members')
            .insert([{
                team_id: teamFound.id,
                user_id: user.id,
                role: 'member'
            }]);

        if (joinError) {
            if (joinError.code === '23505') setError('You are already in a team.'); // Unique violation
            else setError(joinError.message);
            return;
        }

        // 3. Update team count
        await supabase.rpc('increment_team_count', { t_id: teamFound.id });
        // Or manual update if RPC not exists. For now, manual update or rely on trigger?
        // Let's do manual update for MVP
        await supabase
            .from('teams')
            .update({ members_count: teamFound.members_count + 1 })
            .eq('id', teamFound.id);

        setTeam(teamFound);
        fetchMembers(teamFound.id);
        setView('initial');
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave the team?')) return;

        await supabase
            .from('team_members')
            .delete()
            .eq('user_id', user.id);

        // Setup simple decrement
        if (team) {
            await supabase
                .from('teams')
                .update({ members_count: team.members_count - 1 })
                .eq('id', team.id);
        }

        setTeam(null);
        setMembers([]);
    };

    if (loading) return null; // Or skeleton

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
                                {team.logo_url && <img src={team.logo_url} style={{ width: 64, height: 64, borderRadius: '50%' }} />}
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
                            <input
                                className={styles.input}
                                placeholder="Logo URL (Optional)"
                                value={formData.logo_url}
                                onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                            />
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
