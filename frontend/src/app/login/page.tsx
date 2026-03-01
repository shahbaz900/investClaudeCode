"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/demo";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabaseConfigured = isSupabaseConfigured();

    async function handleAuth() {
        if (!email || !password) {
            setError("Email and password are required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                await signUp(email, password);
                setError("Check your email to confirm signup!");
            } else {
                await signIn(email, password);
                router.push("/portfolio");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", maxWidth: "400px", width: "100%" }}>
                <h1 style={{ textAlign: "center", marginBottom: "0.5rem", color: "#2c3e50" }}>
                    {isSignUp ? "Create Account" : "Login"}
                </h1>
                <p style={{ textAlign: "center", marginBottom: "2rem", color: "#666", fontSize: "0.9rem" }}>
                    {isSignUp ? "Sign up to track your portfolio" : "Sign in to your portfolio"}
                </p>

                {!supabaseConfigured && (
                    <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "6px", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#856404" }}>
                        ⚠️ Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!supabaseConfigured || loading}
                        style={{
                            padding: "0.75rem",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            opacity: supabaseConfigured ? 1 : 0.5,
                            cursor: supabaseConfigured ? "text" : "not-allowed"
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={!supabaseConfigured || loading}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAuth();
                        }}
                        style={{
                            padding: "0.75rem",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            opacity: supabaseConfigured ? 1 : 0.5,
                            cursor: supabaseConfigured ? "text" : "not-allowed"
                        }}
                    />

                    {error && (
                        <div style={{
                            background: error.includes("Check your email") ? "#d4edda" : "#f8d7da",
                            border: error.includes("Check your email") ? "1px solid #28a745" : "1px solid #f5c6cb",
                            borderRadius: "6px",
                            padding: "0.75rem",
                            color: error.includes("Check your email") ? "#155724" : "#721c24",
                            fontSize: "0.85rem"
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={!supabaseConfigured || loading}
                        style={{
                            padding: "0.75rem",
                            background: supabaseConfigured ? "#667eea" : "#ccc",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: supabaseConfigured && !loading ? "pointer" : "not-allowed",
                            opacity: loading ? 0.7 : 1,
                            transition: "all 0.3s ease"
                        }}
                    >
                        {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
                    </button>

                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                        disabled={loading}
                        style={{
                            padding: "0.75rem",
                            background: "transparent",
                            color: "#667eea",
                            border: "1px solid #667eea",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease"
                        }}
                    >
                        {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
