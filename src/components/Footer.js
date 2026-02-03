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
                            <h4 id="footer-platform">Platform</h4>
                            <nav aria-labelledby="footer-platform">
                                <a href="/tournaments">Tournaments</a>
                                <a href="/teams">Teams</a>
                                <a href="/creators">Creators</a>
                            </nav>
                        </div>
                        <div className={styles.column}>
                            <h4 id="footer-company">Company</h4>
                            <nav aria-labelledby="footer-company">
                                <a href="/about">About</a>
                                <a href="/careers">Careers</a>
                                <a href="/contact">Contact</a>
                            </nav>
                        </div>
                        <div className={styles.column}>
                            <h4 id="footer-social">Social</h4>
                            <nav aria-labelledby="footer-social">
                                <a href="https://twitter.com/gamerpro" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter">Twitter</a>
                                <a href="https://discord.gg/gamerpro" target="_blank" rel="noopener noreferrer" aria-label="Join our Discord">Discord</a>
                                <a href="https://instagram.com/gamerpro" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram">Instagram</a>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; 2026 GamerPro Inc. All rights reserved.</p>
                    <div className={styles.legal}>
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
