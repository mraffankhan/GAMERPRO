'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './Tournaments.module.css';
import { useRouter } from 'next/navigation';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [registering, setRegistering] = useState(null);
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

    const handleRegister = async (tournamentId) => {
        setRegistering(tournamentId);

        // 1. Check Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to register.');
            router.push('/login');
            setRegistering(null);
            return;
        }

        // 2. Get User's Team
        const { data: memberData } = await supabase
            .from('team_members')
            .select('team_id, teams(members_count)')
            .eq('user_id', session.user.id)
            .single();

        if (!memberData) {
            alert('You must be in a team to register.');
            router.push('/teams');
            setRegistering(null);
            return;
        }

        // 3. Check Team Size (Compulsory 4)
        if (memberData.teams.members_count !== 4) {
            alert(`Team requirements not met. You have ${memberData.teams.members_count} members, but exactly 4 are required.`);
            setRegistering(null);
            return;
        }

        // 4. Register
        const { error } = await supabase
            .from('tournament_registrations')
            .insert([{
                tournament_id: tournamentId,
                team_id: memberData.team_id
            }]);

        if (error) {
            if (error.code === '23505') alert('Your team is already registered!');
            else alert(`Registration failed: ${error.message}`);
        } else {
            alert('Successfully registered for the tournament!');
        }

        setRegistering(null);
    };

    return (
        <section id="tournaments" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Featured Tournaments</h2>
                    <a href="#" className={styles.viewAll}>View All &rarr;</a>
                </div>

                <div className={styles.grid}>
                    {tournaments.length === 0 ? (
                        <p style={{ color: '#888' }}>Loading tournaments...</p>
                    ) : (
                        tournaments.map((t) => (
                            <div key={t.id} className={`${styles.card} glass-panel`}>
                                <div className={styles.imagePlaceholder} style={t.image_url ? { backgroundImage: `url(${t.image_url})` } : {}}></div>
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
                                    <button
                                        onClick={() => handleRegister(t.id)}
                                        disabled={registering === t.id}
                                        style={{
                                            width: '100%',
                                            marginTop: '1rem',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#34d399',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            opacity: registering === t.id ? 0.7 : 1,
                                            fontSize: '0.9rem'
                                        }}
                                        onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                        onMouseOut={(e) => e.target.style.opacity = '1'}
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
