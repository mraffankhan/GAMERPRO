import styles from './Teams.module.css';

const teams = [
    { id: 1, name: "Liquid Pulse", wins: 42, members: 5 },
    { id: 2, name: "Blackout Gaming", wins: 38, members: 6 },
    { id: 3, name: "Void Runners", wins: 31, members: 4 },
    { id: 4, name: "Echo Protocol", wins: 29, members: 5 },
];

export default function Teams() {
    return (
        <section id="teams" className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Elite Teams</h2>
                    <p className={styles.subtitle}>Top performers this season</p>
                </div>

                <div className={styles.grid}>
                    {teams.map((team) => (
                        <div key={team.id} className={styles.card}>
                            <div className={styles.logo}>
                                {team.name[0]}
                            </div>
                            <h3 className={styles.name}>{team.name}</h3>
                            <div className={styles.stats}>
                                <div className={styles.stat}>
                                    <span>Wins</span>
                                    <strong>{team.wins}</strong>
                                </div>
                                <div className={styles.separator}></div>
                                <div className={styles.stat}>
                                    <span>Members</span>
                                    <strong>{team.members}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
