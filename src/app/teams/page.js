import Teams from "@/components/Teams";
import MyTeam from "@/components/MyTeam";
import styles from "./page.module.css";

export const metadata = {
    title: "Teams | GamerPro",
    description: "Browse elite esports teams and organizations.",
};

export default function TeamsPage() {
    return (
        <main className={styles.main}>
            <MyTeam />
            <Teams />
        </main>
    );
}
