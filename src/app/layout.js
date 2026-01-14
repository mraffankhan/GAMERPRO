import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// We will load fonts via CSS imports/links in Head or strictly via next/font if available. 
// Since Fontshare is external, we'll add link tags. 
// For Google Fonts, we can use next/font/google.

import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

const ibmPlex = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: "GamerPro | Premium Esports Platform",
  description: "Where Competitive Esports Meets Opportunity. Join tournaments, form teams, and climb the ranks.",
  keywords: ["esports", "tournaments", "gaming", "teams", "gamerpro", "competitive gaming"],
  authors: [{ name: "GamerPro Team" }],
  openGraph: {
    title: "GamerPro | Premium Esports Platform",
    description: "Where Competitive Esports Meets Opportunity",
    url: "https://gamerpro.com",
    siteName: "GamerPro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GamerPro | Premium Esports Platform",
    description: "Where Competitive Esports Meets Opportunity",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@600,700&f[]=general-sans@500,600&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@600,700&f[]=general-sans@500,600&display=swap"
        />
      </head>
      <body className={`${ibmPlex.variable} ${spaceGrotesk.variable}`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html >
  );
}
