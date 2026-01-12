import styles from './Creators.module.css';

const creators = [
    { id: 1, name: "Sarah 'Viper' Chen", role: "Variety Streamer", followers: "2.4M", platform: "Twitch" },
    { id: 2, name: "Alex 'Glitch' Novak", role: "Pro Analyst", followers: "850K", platform: "YouTube" },
    { id: 3, name: "Marcus 'Tank' Rivera", role: "Co-Streamer", followers: "1.2M", platform: "Kick" },
];

export default function Creators() {
    return (
        <section id="creators" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Spotlight Creators</h2>
                    <p className={styles.subtitle}>Partnered voices of the community</p>
                </div>

                <div className={styles.cards}>
                    {creators.map((c) => (
                        <div key={c.id} className={styles.card}>
                            <div className={styles.avatar}></div>
                            <div className={styles.info}>
                                <h3 className={styles.name}>{c.name}</h3>
                                <span className={styles.role}>{c.role}</span>
                                <div className={styles.stats}>
                                    <span className={styles.followers}>{c.followers}</span>
                                    <span className={styles.platform}>{c.platform}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
