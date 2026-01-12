'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase-auth';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (!supabase) return;

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);
    const toggleProfile = () => setShowProfile(!showProfile);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setShowProfile(false);
            setIsOpen(false);
            // Optional: redirect to home or refresh
        }
    };

    const getMobileTitle = () => {
        if (pathname === '/') return 'GAMERPRO';
        const segment = pathname.split('/')[1];
        return segment ? segment.toUpperCase() : 'GAMERPRO';
    };

    // Get display name or default
    const getDisplayName = () => {
        if (!user) return '';
        return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    };

    const getInitials = () => {
        const name = getDisplayName();
        return name.slice(0, 1).toUpperCase();
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.desktopLogo}>GAMERPRO</span>
                    <span className={styles.mobileLogo}>{getMobileTitle()}</span>
                </Link>

                {/* Desktop Links */}
                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Home</Link>
                    <Link href="/tournaments" className={styles.link}>Tournaments</Link>
                    <Link href="/teams" className={styles.link}>Teams</Link>
                    <Link href="/creators" className={styles.link}>Creators</Link>
                    <Link href="/social" className={styles.link}>Social</Link>
                </div>

                <div className={styles.actions}>
                    {user ? (
                        <div className={styles.profileSection} onClick={toggleProfile}>
                            <span className={styles.username}>{getDisplayName()}</span>
                            <div className={styles.profileIcon}>
                                {user.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    getInitials()
                                )}
                            </div>

                            {showProfile && (
                                <div className={styles.dropdown}>
                                    <button onClick={handleLogout} className={styles.dropdownItem}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className={styles.loginBtn}>
                            <Link href="/login">Login</Link>
                        </button>
                    )}

                    {/* Hamburger Button */}
                    <button className={styles.hamburger} onClick={toggleMenu} aria-label="Menu">
                        <span className={`${styles.bar} ${isOpen ? styles.open : ''}`}></span>
                        <span className={`${styles.bar} ${isOpen ? styles.open : ''}`}></span>
                        <span className={`${styles.bar} ${isOpen ? styles.open : ''}`}></span>
                    </button>
                </div>

                {/* Mobile Drawer */}
                <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
                    <Link href="/" className={styles.drawerLink} onClick={toggleMenu}>Home</Link>
                    <Link href="/tournaments" className={styles.drawerLink} onClick={toggleMenu}>Tournaments</Link>
                    <Link href="/teams" className={styles.drawerLink} onClick={toggleMenu}>Teams</Link>
                    <Link href="/creators" className={styles.drawerLink} onClick={toggleMenu}>Creators</Link>
                    <Link href="/social" className={styles.drawerLink} onClick={toggleMenu}>Social</Link>
                    <hr className={styles.divider} />

                    {user ? (
                        <button onClick={handleLogout} className={styles.drawerLink} style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}>
                            Logout ({getDisplayName()})
                        </button>
                    ) : (
                        <Link href="/login" className={styles.drawerLink} onClick={toggleMenu}>Login</Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
