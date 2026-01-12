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
                    {feed.map((post) => (
                        <div key={post.id} className={styles.post}>
                            <div className={styles.postHeader}>
                                <span className={styles.user}>{post.user}</span>
                                <span className={styles.time}>{post.time}</span>
                            </div>
                            <p className={styles.content}>{post.content}</p>
                            <div className={styles.actions}>
                                <button>Like</button>
                                <button>Comment</button>
                                <button>Share</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
