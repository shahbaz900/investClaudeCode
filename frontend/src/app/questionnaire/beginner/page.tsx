"use client";
import { useState } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormData {
    age: string;
    country: string;
    investmentExperience: string;
    incomeLevel: string;
    investmentTimeframe: string;
    riskTolerance: string;
    savingsAmount: string;
    investmentGoal: string;
    monthlyInvestment: string;
    existingInvestments: string;
}

const QUESTIONS = [
    {
        id: "age",
        label: "What is your age?",
        type: "mcq",
        options: [
            { value: "18-25", label: "18-25 years" },
            { value: "26-35", label: "26-35 years" },
            { value: "36-45", label: "36-45 years" },
            { value: "46-55", label: "46-55 years" },
            { value: "55+", label: "55+ years" },
        ],
    },
    {
        id: "country",
        label: "Which country are you investing from?",
        type: "mcq",
        options: [
            { value: "United States", label: "🇺🇸 United States" },
            { value: "Canada", label: "🇨🇦 Canada" },
            { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
            { value: "Germany", label: "🇩🇪 Germany" },
            { value: "France", label: "🇫🇷 France" },
            { value: "Pakistan", label: "🇵🇰 Pakistan" },
            { value: "India", label: "🇮🇳 India" },
            { value: "Australia", label: "🇦🇺 Australia" },
            { value: "Japan", label: "🇯🇵 Japan" },
            { value: "Other", label: "Other" },
        ],
    },
    {
        id: "investmentExperience",
        label: "What is your investment experience?",
        type: "mcq",
        options: [
            { value: "beginner", label: "Beginner - Never invested before" },
            { value: "novice", label: "Novice - Less than 1 year experience" },
            { value: "intermediate", label: "Intermediate - 1-5 years experience" },
            { value: "advanced", label: "Advanced - 5+ years experience" },
        ],
    },
    {
        id: "incomeLevel",
        label: "What is your annual income level?",
        type: "mcq",
        options: [
            { value: "under-50k", label: "Under $50,000" },
            { value: "50k-100k", label: "$50,000 - $100,000" },
            { value: "100k-200k", label: "$100,000 - $200,000" },
            { value: "200k-500k", label: "$200,000 - $500,000" },
            { value: "500k+", label: "$500,000+" },
        ],
    },
    {
        id: "investmentTimeframe",
        label: "What is your investment timeframe?",
        type: "mcq",
        options: [
            { value: "less-1yr", label: "Less than 1 year" },
            { value: "1-5yr", label: "1-5 years" },
            { value: "5-10yr", label: "5-10 years" },
            { value: "10-20yr", label: "10-20 years" },
            { value: "20yr+", label: "20+ years" },
        ],
    },
    {
        id: "riskTolerance",
        label: "How much risk are you comfortable taking?",
        type: "mcq",
        options: [
            { value: "very-low", label: "Very Low - Prefer stable, safe investments" },
            { value: "low", label: "Low - Modest growth with minimal fluctuation" },
            { value: "medium", label: "Medium - Balanced growth and risk" },
            { value: "high", label: "High - Aggressive growth, comfortable with volatility" },
            { value: "very-high", label: "Very High - Maximum growth, willing to lose principal" },
        ],
    },
    {
        id: "savingsAmount",
        label: "How much are you looking to invest initially?",
        type: "mcq",
        options: [
            { value: "500-5k", label: "$500 - $5,000" },
            { value: "5k-25k", label: "$5,000 - $25,000" },
            { value: "25k-100k", label: "$25,000 - $100,000" },
            { value: "100k-500k", label: "$100,000 - $500,000" },
            { value: "500k+", label: "$500,000+" },
        ],
    },
    {
        id: "investmentGoal",
        label: "What is your primary investment goal?",
        type: "mcq",
        options: [
            { value: "retirement", label: "Retirement Planning" },
            { value: "wealth-building", label: "Long-term Wealth Building" },
            { value: "income", label: "Regular Income Generation" },
            { value: "short-term-growth", label: "Short-term Capital Growth" },
            { value: "education", label: "Education Fund" },
            { value: "other", label: "Other" },
        ],
    },
    {
        id: "monthlyInvestment",
        label: "How much can you invest monthly?",
        type: "mcq",
        options: [
            { value: "none", label: "One-time investment only" },
            { value: "100-500", label: "$100 - $500/month" },
            { value: "500-1k", label: "$500 - $1,000/month" },
            { value: "1k-5k", label: "$1,000 - $5,000/month" },
            { value: "5k+", label: "$5,000+/month" },
        ],
    },
    {
        id: "existingInvestments",
        label: "Do you have existing investments?",
        type: "mcq",
        options: [
            { value: "none", label: "No existing investments" },
            { value: "savings-only", label: "Only savings/cash accounts" },
            { value: "some-stocks", label: "Some stocks/ETFs" },
            { value: "diversified", label: "Diversified portfolio" },
        ],
    },
];

export default function BeginnerQuestionnairePage() {
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        age: "",
        country: "",
        investmentExperience: "",
        incomeLevel: "",
        investmentTimeframe: "",
        riskTolerance: "",
        savingsAmount: "",
        investmentGoal: "",
        monthlyInvestment: "",
        existingInvestments: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const question = QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

    function handleSelect(value: string) {
        setFormData((prev) => ({
            ...prev,
            [question.id]: value,
        }));

        setTimeout(() => {
            if (currentQuestion < QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            }
        }, 300);
    }

    async function handleSubmit() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/personalized-recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to get recommendations");
            }

            const data = await response.json();
            sessionStorage.setItem("recommendations", JSON.stringify({
                profile: formData,
                recommendations: data.recommendations,
                isProfessional: false,
            }));

            router.push("/questionnaire-results");
        } catch (err) {
            console.error("Error:", err);
            setError("Failed to generate recommendations. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function handleBack() {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    }

    const isAnswered = formData[question.id as keyof FormData] !== "";
    const isLastQuestion = currentQuestion === QUESTIONS.length - 1;

    return (
        <>
            <div className="page-header">
                <h1>Create Your Investment Profile</h1>
                <p>Answer a few simple questions to get personalized stock recommendations based on your goals and risk profile.</p>
            </div>

            <div className="container" style={{ maxWidth: 600, paddingBottom: "4rem" }}>
                {/* Progress Bar */}
                <div style={{ marginBottom: "2rem" }}>
                    <div style={{
                        height: "6px",
                        background: "var(--bg-secondary)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: "var(--accent)",
                            transition: "width 0.3s ease",
                        }} />
                    </div>
                    <p style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "0.5rem",
                        textAlign: "center",
                    }}>
                        Question {currentQuestion + 1} of {QUESTIONS.length}
                    </p>
                </div>

                {/* Question */}
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "var(--text-h)" }}>
                        {question.label}
                    </h2>

                    {/* Options */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {question.options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                style={{
                                    padding: "1rem 1.25rem",
                                    border: formData[question.id as keyof FormData] === option.value
                                        ? "2px solid var(--accent)"
                                        : "2px solid var(--border)",
                                    background: formData[question.id as keyof FormData] === option.value
                                        ? "rgba(59, 130, 246, 0.08)"
                                        : "transparent",
                                    borderRadius: "var(--radius-md)",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    fontSize: "1rem",
                                    transition: "all 0.2s ease",
                                    fontWeight: formData[question.id as keyof FormData] === option.value ? 600 : 400,
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {error && <p style={{ color: "var(--red)", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</p>}
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
                    <button
                        onClick={handleBack}
                        disabled={currentQuestion === 0}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1.5rem",
                            background: currentQuestion === 0 ? "var(--bg-secondary)" : "transparent",
                            border: "2px solid var(--border)",
                            color: currentQuestion === 0 ? "var(--text-muted)" : "var(--text-primary)",
                            borderRadius: "var(--radius-md)",
                            cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            opacity: currentQuestion === 0 ? 0.5 : 1,
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!isAnswered || loading}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 2rem",
                                background: !isAnswered || loading ? "var(--bg-secondary)" : "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                cursor: !isAnswered || loading ? "not-allowed" : "pointer",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                opacity: !isAnswered || loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Generating..." : "Get Recommendations"}
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            disabled={!isAnswered}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 2rem",
                                background: !isAnswered ? "var(--bg-secondary)" : "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                cursor: !isAnswered ? "not-allowed" : "pointer",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                opacity: !isAnswered ? 0.6 : 1,
                            }}
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
