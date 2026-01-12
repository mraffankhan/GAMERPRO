'use client';

import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
    const pathname = usePathname();

    if (pathname === '/login') {
        return null;
    }

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <h3 className={styles.logo}>GAMERPRO</h3>
                        <p className={styles.desc}>Where Competitive Esports Meets Opportunity.</p>
                    </div>

                    <div className={styles.links}>
                        <div className={styles.column}>
                            <h4>Platform</h4>
                            <a href="#">Tournaments</a>
                            <a href="#">Teams</a>
                            <a href="#">Creators</a>
                        </div>
                        <div className={styles.column}>
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Careers</a>
                            <a href="#">Contact</a>
                        </div>
                        <div className={styles.column}>
                            <h4>Social</h4>
                            <a href="#">Twitter</a>
                            <a href="#">Discord</a>
                            <a href="#">Instagram</a>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; 2026 GamerPro Inc. All rights reserved.</p>
                    <div className={styles.legal}>
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
