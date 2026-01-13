'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-auth';
import styles from './Creators.module.css';

export default function Creators() {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCreators = async () => {
            const { data } = await supabase
                .from('creators')
                .select('*');
            if (data) setCreators(data);
            setLoading(false);
        };
        fetchCreators();
    }, []);

    return (
        <section id="creators" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Spotlight Creators</h2>
                    <p className={styles.subtitle}>Partnered voices of the community</p>
                </div>

                <div className={styles.cards}>
                    {loading ? (
                        <p style={{ color: '#666', textAlign: 'center', width: '100%', padding: '40px' }}>Loading creators...</p>
                    ) : creators.length === 0 ? (
                        <div style={{ textAlign: 'center', width: '100%', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.2rem' }}>No Partnered Creators</h3>
                            <p style={{ color: '#888' }}>Check back later for updates!</p>
                        </div>
                    ) : (
                        creators.map((c) => (
                            <div key={c.id} className={styles.card}>
                                <div className={styles.avatar}>
                                    {c.avatar_url && <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />}
                                </div>
                                <div className={styles.info}>
                                    <h3 className={styles.name}>{c.name}</h3>
                                    {/* Assuming database might not have role yet, or it's optional */}
                                    {c.role && <span className={styles.role}>{c.role}</span>}
                                    <div className={styles.stats}>
                                        <span className={styles.followers}>{c.followers}</span>
                                        <span className={styles.platform}>{c.platform}</span>
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
