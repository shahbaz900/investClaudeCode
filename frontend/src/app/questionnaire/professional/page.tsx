"use client";
import { useState } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormData {
    country: string;
    capitalMin: number;
    capitalMax: number;
    monthlyMin: number;
    monthlyMax: number;
    investmentExperience: string;
    investmentTimeframe: string;
    riskTolerance: string;
    investmentStrategy: string;
}

const COUNTRIES = [
    { value: "US", label: "🇺🇸 United States", currency: "USD", symbol: "$" },
    { value: "Canada", label: "🇨🇦 Canada", currency: "CAD", symbol: "C$" },
    { value: "UK", label: "🇬🇧 United Kingdom", currency: "GBP", symbol: "£" },
    { value: "Germany", label: "🇩🇪 Germany", currency: "EUR", symbol: "€" },
    { value: "France", label: "🇫🇷 France", currency: "EUR", symbol: "€" },
    { value: "Pakistan", label: "🇵🇰 Pakistan", currency: "PKR", symbol: "₨" },
    { value: "India", label: "🇮🇳 India", currency: "INR", symbol: "₹" },
    { value: "Australia", label: "🇦🇺 Australia", currency: "AUD", symbol: "A$" },
    { value: "Japan", label: "🇯🇵 Japan", currency: "JPY", symbol: "¥" },
];

interface Question {
    id: string;
    label: string;
    type: string;
    options?: Array<{ value: string; label: string; currency?: string; symbol?: string }>;
    hint?: string;
}

const QUESTIONS: Question[] = [
    {
        id: "country",
        label: "Select your investment country",
        type: "mcq",
        options: COUNTRIES,
    },
    {
        id: "capitalInput",
        label: "How much do you want to start investing with?",
        type: "range-input",
        hint: "Enter the amount in your local currency",
    },
    {
        id: "sipInput",
        label: "How much do you want to invest every month?",
        type: "range-input-optional",
        hint: "Enter monthly amount (you can skip this if you prefer)",
    },
    {
        id: "investmentExperience",
        label: "How long have you been investing?",
        type: "mcq",
        options: [
            { value: "0-1yr", label: "Less than 1 year (Just started)" },
            { value: "1-5yr", label: "1-5 years" },
            { value: "5-10yr", label: "5-10 years" },
            { value: "10yr+", label: "10+ years" },
        ],
    },
    {
        id: "investmentTimeframe",
        label: "How long do you plan to keep your money invested?",
        type: "mcq",
        options: [
            { value: "0-1yr", label: "Less than 1 year" },
            { value: "1-3yr", label: "1-3 years" },
            { value: "3-10yr", label: "3-10 years" },
            { value: "10yr+", label: "10+ years" },
        ],
    },
    {
        id: "riskTolerance",
        label: "How comfortable are you with market ups and downs?",
        type: "mcq",
        options: [
            { value: "capital-preservation", label: "Safe & Steady (Prefer lower risk)" },
            { value: "moderate-growth", label: "Balanced (Mix of safety and growth)" },
            { value: "aggressive-growth", label: "Growth Focused (Willing to take risk)" },
        ],
    },
    {
        id: "investmentStrategy",
        label: "What type of investments interest you?",
        type: "mcq",
        options: [
            { value: "value", label: "💎 Good Value Stocks" },
            { value: "growth", label: "📈 Fast Growing Companies" },
            { value: "dividend", label: "💰 Income Stocks" },
            { value: "balanced", label: "⚖️ Mix of Everything" },
        ],
    },
];

export default function ProfessionalQuestionnaire() {
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        country: "",
        capitalMin: 0,
        capitalMax: 0,
        monthlyMin: 0,
        monthlyMax: 0,
        investmentExperience: "",
        investmentTimeframe: "",
        riskTolerance: "",
        investmentStrategy: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const question = QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const selectedCountry = COUNTRIES.find(c => c.value === formData.country);
    const currencySymbol = selectedCountry?.symbol || "$";

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

    function handleRangeInput(minValue: number, maxValue: number) {
        if (question.id === "capitalInput") {
            setFormData((prev) => ({
                ...prev,
                capitalMin: minValue,
                capitalMax: maxValue,
            }));
        } else if (question.id === "sipInput") {
            setFormData((prev) => ({
                ...prev,
                monthlyMin: minValue,
                monthlyMax: maxValue,
            }));
        }

        setTimeout(() => {
            if (currentQuestion < QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            }
        }, 300);
    }

    function handleBack() {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    }

    async function handleSubmit() {
        console.log("[QUESTIONNAIRE] Submitting formData:", formData);
        console.log("[QUESTIONNAIRE] Capital values - Min:", formData.capitalMin, "Max:", formData.capitalMax);
        
        if (!formData.country) {
            setError("❌ Please select a country");
            return;
        }
        if (formData.capitalMin === 0 && formData.capitalMax === 0) {
            setError("❌ Please enter an initial capital amount in the previous step");
            return;
        }
        if (!formData.investmentExperience) {
            setError("❌ Please select your investment experience");
            return;
        }
        if (!formData.riskTolerance) {
            setError("❌ Please select your risk tolerance");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/professional-recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    country: selectedCountry?.value,
                    currency: selectedCountry?.currency,
                    currencySymbol: selectedCountry?.symbol,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to get recommendations");
            }

            const data = await response.json();
            sessionStorage.setItem("recommendations", JSON.stringify({
                profile: formData,
                recommendations: data.recommendations,
                projections: data.projections,
                currency: selectedCountry?.currency,
                currencySymbol: selectedCountry?.symbol,
                initialCapital: data.initialCapital,
                monthlyContribution: data.monthlyContribution,
                isProfessional: true,
            }));

            router.push("/questionnaire-results");
        } catch (err) {
            console.error("Error:", err);
            setError(err instanceof Error ? err.message : "Failed to generate recommendations");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", padding: "2rem", background: "var(--bg-primary)" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>AI Investment Planner</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        Answer {QUESTIONS.length} questions to get personalized investment recommendations
                    </p>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: "2rem" }}>
                    <div style={{ height: "4px", background: "var(--bg-secondary)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                background: "var(--accent)",
                                width: `${progress}%`,
                                transition: "width 0.3s ease",
                            }}
                        />
                    </div>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                        {currentQuestion + 1} of {QUESTIONS.length}
                    </p>
                </div>

                {/* Question Content */}
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "var(--text-h)" }}>
                        {question.label}
                    </h2>

                    {/* MCQ Options */}
                    {question.type === "mcq" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {question.options?.map((option) => (
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
                    )}

                    {/* Range Input for Capital */}
                    {question.type === "range-input" && (
                        <RangeInputComponent
                            currencySymbol={currencySymbol}
                            onSubmit={handleRangeInput}
                            minValue={formData.capitalMin}
                            maxValue={formData.capitalMax}
                            hint={question.hint}
                        />
                    )}

                    {/* Optional Range Input for SIP */}
                    {question.type === "range-input-optional" && (
                        <RangeInputComponent
                            currencySymbol={currencySymbol}
                            onSubmit={handleRangeInput}
                            minValue={formData.monthlyMin}
                            maxValue={formData.monthlyMax}
                            hint={question.hint}
                            optional={true}
                        />
                    )}

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
                            fontWeight: 500,
                            transition: "all 0.2s ease",
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    {currentQuestion === QUESTIONS.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 1.5rem",
                                background: loading ? "var(--bg-secondary)" : "var(--accent)",
                                color: loading ? "var(--text-muted)" : "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                transition: "all 0.2s ease",
                            }}
                        >
                            {loading ? "Generating..." : "Get Recommendations"}
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                // Validate current question before moving to next
                                const currentField = question.id as keyof FormData;
                                const isAnswered = formData[currentField];
                                
                                if (!isAnswered && question.type === "mcq") {
                                    setError("Please select an option to continue");
                                    return;
                                }
                                
                                if ((question.type === "range-input" || question.type === "range-input-optional") && !formData.capitalMin && !formData.monthlyMin) {
                                    if (question.type === "range-input") {
                                        setError("Please enter capital amount");
                                        return;
                                    }
                                }
                                
                                setError("");
                                if (currentQuestion < QUESTIONS.length - 1) {
                                    setCurrentQuestion(currentQuestion + 1);
                                }
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 1.5rem",
                                background: "var(--accent)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                transition: "all 0.2s ease",
                            }}
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface RangeInputComponentProps {
    currencySymbol: string;
    onSubmit: (min: number, max: number) => void;
    minValue: number;
    maxValue: number;
    hint?: string;
    optional?: boolean;
}

function RangeInputComponent({ currencySymbol, onSubmit, minValue, maxValue, hint, optional }: RangeInputComponentProps) {
    const [localMin, setLocalMin] = useState(minValue || "");
    const [localMax, setLocalMax] = useState(maxValue || "");

    const handleSubmit = () => {
        const min = localMin ? Number(localMin) : 0;
        const max = localMax ? Number(localMax) : min;
        
        if (min > 0 || optional) {
            onSubmit(min, max || min);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {hint && <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{hint}</p>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                        From {currencySymbol}
                    </label>
                    <input
                        type="number"
                        value={localMin}
                        onChange={(e) => setLocalMin(e.target.value)}
                        placeholder="Min amount"
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "2px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                        To {currencySymbol}
                    </label>
                    <input
                        type="number"
                        value={localMax}
                        onChange={(e) => setLocalMax(e.target.value)}
                        placeholder="Max amount (optional)"
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "2px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                style={{
                    padding: "0.75rem 1.5rem",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                }}
            >
                Continue
            </button>
        </div>
    );
}
