'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './Tournaments.module.css';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState([]);

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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
