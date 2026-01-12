'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './Tournaments.module.css';
import { useRouter } from 'next/navigation';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [registering, setRegistering] = useState(null);
    const [modal, setModal] = useState({ show: false, type: 'info', title: '', message: '', action: null });
    const router = useRouter();

    useEffect(() => {
        const fetchTournaments = async () => {
            const { data } = await supabase
                .from('tournaments')
                .select('*')
                .order('start_date', { ascending: true });
            if (data) setTournaments(data);
        };
        fetchTournaments();
    }, []);

    const showModal = (type, title, message, action = null) => {
        setModal({ show: true, type, title, message, action });
    };

    const closeModal = () => {
        setModal({ show: false, type: 'info', title: '', message: '', action: null });
    };

    const handleRegister = async (tournamentId, tournamentName) => {
        setRegistering(tournamentId);

        // 1. Check Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showModal('warning', 'Login Required', 'Please log in to register for tournaments.', () => router.push('/login'));
            setRegistering(null);
            return;
        }

        // 2. Get User's Team and Role
        const { data: memberData } = await supabase
            .from('team_members')
            .select('team_id, role, teams(name, members_count)')
            .eq('user_id', session.user.id)
            .single();

        if (!memberData) {
            showModal('warning', 'No Team Found', 'You must be in a team to register. Create or join a team first.', () => router.push('/teams'));
            setRegistering(null);
            return;
        }

        // 3. Check if Captain
        if (memberData.role !== 'captain') {
            showModal('error', 'Captain Only', 'Only team captains can register for tournaments. Ask your captain to register the team.');
            setRegistering(null);
            return;
        }

        // 4. Check Team Size (Compulsory 4)
        if (memberData.teams.members_count !== 4) {
            showModal('warning', 'Team Incomplete', `Your team needs exactly 4 members to register. You currently have ${memberData.teams.members_count} member(s).`);
            setRegistering(null);
            return;
        }

        // 5. Register
        const { error } = await supabase
            .from('tournament_registrations')
            .insert([{
                tournament_id: tournamentId,
                team_id: memberData.team_id
            }]);

        if (error) {
            if (error.code === '23505') {
                showModal('info', 'Already Registered', `Your team "${memberData.teams.name}" is already registered for this tournament.`);
            } else {
                showModal('error', 'Registration Failed', error.message);
            }
        } else {
            showModal('success', 'Registration Successful! 🎉', `Team "${memberData.teams.name}" has been registered for ${tournamentName}. Good luck!`);
        }

        setRegistering(null);
    };

    const getModalIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    const getModalColor = (type) => {
        switch (type) {
            case 'success': return '#34d399';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#60a5fa';
        }
    };

    return (
        <section id="tournaments" className={styles.section}>
            {/* Professional Modal */}
            {modal.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        border: `1px solid ${getModalColor(modal.type)}33`,
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '420px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: `0 0 40px ${getModalColor(modal.type)}20`
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{getModalIcon(modal.type)}</div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', color: '#fff' }}>{modal.title}</h3>
                        <p style={{ color: '#888', marginBottom: '24px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            {modal.message}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            {modal.action ? (
                                <>
                                    <button
                                        onClick={closeModal}
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
                                        onClick={() => { closeModal(); modal.action(); }}
                                        style={{
                                            padding: '12px 24px',
                                            background: getModalColor(modal.type),
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: modal.type === 'warning' ? '#000' : '#fff',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        Continue
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={closeModal}
                                    style={{
                                        padding: '12px 32px',
                                        background: getModalColor(modal.type),
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: modal.type === 'warning' ? '#000' : '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Featured Tournaments</h2>
                    <a href="/tournaments" className={styles.viewAll}>View All &rarr;</a>
                </div>

                <div className={styles.grid}>
                    {tournaments.length === 0 ? (
                        <p style={{ color: '#888' }}>Loading tournaments...</p>
                    ) : (
                        tournaments.map((t) => (
                            <div key={t.id} className={`${styles.card} glass-panel`}>
                                <div className={styles.imagePlaceholder} style={t.image_url ? { backgroundImage: `url(${t.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}></div>
                                <div className={styles.content}>
                                    <span className={styles.game}>{t.game}</span>
                                    <h3 className={styles.name}>{t.name}</h3>
                                    <div className={styles.meta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Prize Pool</span>
                                            <span className={styles.value}>{t.prize}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Starts</span>
                                            <span className={styles.value}>{t.start_date}</span>
                                        </div>
                                    </div>
                                    <div className={styles.meta} style={{ marginTop: '12px' }}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Teams</span>
                                            <span className={styles.value}>{t.max_teams || 12} Teams</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Format</span>
                                            <span className={styles.value}>{t.total_stages || 5} Stages</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRegister(t.id, t.name)}
                                        disabled={registering === t.id}
                                        style={{
                                            width: '100%',
                                            marginTop: '1rem',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'var(--accent-primary)',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            opacity: registering === t.id ? 0.7 : 1,
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => { if (registering !== t.id) e.target.style.background = '#fff'; }}
                                        onMouseOut={(e) => { if (registering !== t.id) e.target.style.background = 'var(--accent-primary)'; }}
                                    >
                                        {registering === t.id ? 'Checking...' : 'Register Team'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
