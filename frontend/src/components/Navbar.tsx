"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp } from "lucide-react";

const links = [
    { href: "/", label: "Home" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/about", label: "About" },
];

export default function Navbar() {
    const pathname = usePathname();
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-logo">
                    <div className="logo-icon">
                        <TrendingUp size={16} />
                    </div>
                    SmartStock Picks
                </Link>
                <div className="navbar-nav">
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`nav-link ${pathname === l.href ? "active" : ""}`}
                        >
                            {l.label}
                        </Link>
                    ))}
                    <Link href="/portfolio" className="btn-nav">
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
}
