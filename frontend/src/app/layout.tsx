import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SmartStock Picks — Personalized AI Stock Recommendations",
    description:
        "Get AI-powered, personalized stock recommendations tailored to your country and investment goals.",
    keywords: ["stocks", "AI", "investing", "Claude", "portfolio"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className} style={{ background: "var(--bg)" }}>
                <Navbar />
                <main style={{ minHeight: "100vh", paddingTop: 60 }}>{children}</main>
                <footer style={{
                    borderTop: "1px solid var(--border)",
                    padding: "1.25rem",
                    textAlign: "center",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    background: "#fff",
                }}>
                    © {new Date().getFullYear()} SmartStock Picks
                </footer>
            </body>
        </html>
    );
}
