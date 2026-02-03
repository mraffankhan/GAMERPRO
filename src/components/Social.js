import styles from './Social.module.css';

const feed = [
    { id: 1, user: "GamerPro Official", time: "2h ago", content: "Registration for the Winter Major is now LIVE! prize pool starts at $50k. Don't miss out." },
    { id: 2, user: "Liquid Pulse", time: "5h ago", content: "We are excited to announce our new roster for the upcoming season. #Esports #Valorant" },
    { id: 3, user: "Tournament Bot", time: "1d ago", content: "Match results: Void Runners [2] - [1] Echo Protocol. MVP: @void_striker" },
];

export default function Social() {
    return (
        <section id="social" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <h2 className={styles.title}>Community Feed</h2>

                <div className={styles.feed}>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <a href="https://discord.gg/ZT4KXFK3RD" target="_blank" rel="noopener noreferrer"
                            style={{
                                padding: '12px 24px',
                                background: '#5865F2',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                            Join Discord
                        </a>
                        <a href="https://instagram.com/gamerpro.ind" target="_blank" rel="noopener noreferrer"
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                            Follow Instagram
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
