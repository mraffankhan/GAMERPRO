import Tournaments from "@/components/Tournaments";
import styles from "./page.module.css";

export const metadata = {
    title: "Tournaments | GamerPro",
    description: "Join high-stakes tournaments in Valorant, Apex Legends, and more.",
};

export default function TournamentsPage() {
    return (
        <main className={styles.main}>
            <Tournaments />
        </main>
    );
}
