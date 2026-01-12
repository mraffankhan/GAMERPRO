'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './Teams.module.css';

export default function Teams() {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchTeams = async () => {
            const { data } = await supabase
                .from('teams')
                .select('*')
                .order('wins', { ascending: false });
            if (data) setTeams(data);
        };
        fetchTeams();
    }, []);

    return (
        <section id="teams" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Elite Teams</h2>
                    <p className={styles.subtitle}>Top performers this season</p>
                </div>

                <div className={styles.grid}>
                    {teams.length === 0 ? (
                        <p style={{ color: '#888' }}>Loading teams...</p>
                    ) : (
                        teams.map((team) => (
                            <div key={team.id} className={styles.card}>
                                <div className={styles.logo}>
                                    {team.logo_url ? <img src={team.logo_url} alt={team.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : team.name[0]}
                                </div>
                                <h3 className={styles.name}>{team.name}</h3>
                                <div className={styles.stats}>
                                    <div className={styles.stat}>
                                        <span>Wins</span>
                                        <strong>{team.wins}</strong>
                                    </div>
                                    <div className={styles.separator}></div>
                                    <div className={styles.stat}>
                                        <span>Members</span>
                                        <strong>{team.members_count}</strong>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
