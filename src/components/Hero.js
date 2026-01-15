import styles from './Hero.module.css';
import Link from 'next/link';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.background}>
                <div className={styles.blob1}></div>
                <div className={styles.blob2}></div>
            </div>

            <div className={`container ${styles.container}`}>
                <h1 className={styles.headline}>
                    DOMINATE <br />
                    <span className={styles.highlight}>THE ARENA</span>
                </h1>

                <p className={styles.subtext}>
                    The elite platform for high-stakes esports.
                    Create, compete, and conquer in tournaments designed for the pros.
                    Experience the next evolution of competitive gaming.
                </p>

                <div className={styles.actions}>
                    <Link href="/tournaments" className={styles.glassBtnPrimary}>
                        Start Competing
                    </Link>
                    <button className={styles.glassBtnSecondary}>
                        Coming Soon
                    </button>
                </div>

                {/* 3D Dashboard Preview Visual */}
                {/* Partners Ticker */}
                <div className={styles.partnersSection}>
                    <p className={styles.partnersLabel}>PARTNERED WITH</p>
                    <div className={styles.tickerContainer}>
                        <div className={styles.tickerTrack}>
                            {/* Duplicate logos for infinite scroll effect */}
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className={styles.partnerLogos}>
                                    <img src="/Untitled8.png" alt="DU ESPORTS" className={styles.partnerLogo} />
                                    <img src="/Screenshot%202026-01-13%20140653.png" alt="REX ESPORTS" className={styles.partnerLogo} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
