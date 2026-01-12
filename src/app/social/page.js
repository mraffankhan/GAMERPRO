import Social from "@/components/Social";
import styles from "./page.module.css";

export const metadata = {
    title: "Community Feed | GamerPro",
    description: "Stay updated with the latest news and community posts.",
};

export default function SocialPage() {
    return (
        <main className={styles.main}>
            <Social />
        </main>
    );
}
