import styles from './Tournaments.module.css';

const tournaments = [
    { id: 1, name: "Valorant Masters", game: "Valorant", prize: "$100,000", date: "Feb 15, 2026" },
    { id: 2, name: "Apex Legends Global", game: "Apex Legends", prize: "$75,000", date: "Feb 22, 2026" },
    { id: 3, name: "CS2 Pro League", game: "Counter-Strike 2", prize: "$250,000", date: "Mar 01, 2026" },
    { id: 4, name: "Rocket League Championship", game: "Rocket League", prize: "$50,000", date: "Mar 10, 2026" },
];

export default function Tournaments() {
    return (
        <section id="tournaments" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Featured Tournaments</h2>
                    <a href="#" className={styles.viewAll}>View All &rarr;</a>
                </div>

                <div className={styles.grid}>
                    {tournaments.map((t) => (
                        <div key={t.id} className={`${styles.card} glass-panel`}>
                            <div className={styles.imagePlaceholder}></div>
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
                                        <span className={styles.value}>{t.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
