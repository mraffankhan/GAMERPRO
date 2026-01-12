import Creators from "@/components/Creators";
import styles from "./page.module.css";

export const metadata = {
    title: "Creators | GamerPro",
    description: "Meet the voices of the GamerPro community.",
};

export default function CreatorsPage() {
    return (
        <main className={styles.main}>
            <Creators />
        </main>
    );
}
