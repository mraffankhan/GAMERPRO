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
                    <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ color: '#aaa', fontWeight: '400' }}>Social Media handles will be available here soon! 🚀</h3>
                    </div>
                </div>
            </div>
        </section>
    );
}
