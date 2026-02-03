import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Orbitron, Inter } from "next/font/google";

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: "GamerPro | Premium Esports Platform",
  description: "Next-gen esports tournament platform. Join, compete, and win.",
  keywords: ["esports", "tournaments", "gaming", "teams", "gamerpro", "competitive gaming"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${inter.variable}`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
