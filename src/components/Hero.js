import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.background}>
                <div className={styles.blob1}></div>
                <div className={styles.blob2}></div>
            </div>

            <div className={`container ${styles.container}`}>
                <h1 className={styles.headline}>
                    Where Competitive <br />
                    <span className="text-gradient">Esports Meets Opportunity</span>
                </h1>

                <p className={styles.subtext}>
                    The premium platform for hosting, managing, and competing in high-stakes tournaments.
                    Built for organizers, teams, and creators who demand excellence.
                </p>

                <div className={styles.actions}>
                    <a href="/tournaments" className="btn-primary">Explore Tournaments</a>
                    <button className="btn-secondary">Host a Tournament</button>
                </div>
            </div>
        </section>
    );
}
