"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from "lucide-react";

type AuthMode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already logged in, redirect to workstation
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setLoading(true);

      if (mode === "sign-up") {
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        const { error: signUpErr } = await signUp(email, password, fullName);
        if (signUpErr) {
          setError(signUpErr.message);
          setLoading(false);
        } else {
          // Immediately redirect to the OTP confirmation page
          router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        }
      } else {
        const { error: signInErr } = await signIn(email, password);
        if (signInErr) {
          setError(signInErr.message);
        }
        setLoading(false);
      }
    },
    [mode, email, password, fullName, signIn, signUp, router],
  );

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
    setError(null);
    setSuccess(null);
  }, []);

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div className="auth-bg-gradient" aria-hidden="true" />
      <div className="auth-bg-orb auth-bg-orb--1" aria-hidden="true" />
      <div className="auth-bg-orb auth-bg-orb--2" aria-hidden="true" />
      <div className="auth-bg-grid" aria-hidden="true" />

      <div className="auth-container">
        {/* LEFT: Branding panel */}
        <div className="auth-branding">
          <div className="auth-branding__inner">
            <div className="auth-branding__logo-wrap">
              <Logo />
            </div>
            <h2 className="auth-branding__headline">
              Evidence-Grounded
              <br />
              Medical Intelligence
            </h2>
            <p className="auth-branding__sub">
              AI-powered second-opinion assistant for chest X-ray pneumonia
              assessment — built with clinical rigor and multimodal evidence
              fusion.
            </p>

            <div className="auth-branding__features">
              <div className="auth-feature-pill">
                <ShieldCheck className="h-4 w-4" />
                <span>Evidence Firewall</span>
              </div>
              <div className="auth-feature-pill">
                <Sparkles className="h-4 w-4" />
                <span>DenseNet-121 + MedGemma</span>
              </div>
            </div>

            <div className="auth-branding__disclaimer">
              <p>
                LumiVue is a clinical decision-support prototype. It does not
                replace professional medical judgement. All findings must be
                independently verified by qualified physicians.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Auth card */}
        <div className="auth-card-panel">
          <div className="auth-card">
            <div className="auth-card__header">
              <h1 className="auth-card__title">
                {mode === "sign-in"
                  ? "Welcome Back"
                  : "Create Your Account"}
              </h1>
              <p className="auth-card__subtitle">
                {mode === "sign-in"
                  ? "Sign in to access the diagnostic workstation"
                  : "Join LumiVue to start analyzing chest radiographs"}
              </p>
            </div>

            {/* Status alerts */}
            {error && (
              <div className="auth-alert auth-alert--error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-alert auth-alert--success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "sign-up" && (
                <div className="auth-field">
                  <label htmlFor="auth-fullname" className="auth-label">
                    Full Name
                  </label>
                  <div className="auth-input-wrap">
                    <User className="auth-input-icon" />
                    <input
                      id="auth-fullname"
                      type="text"
                      className="auth-input"
                      placeholder="Dr. Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email" className="auth-label">
                  Email Address
                </label>
                <div className="auth-input-wrap">
                  <Mail className="auth-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-input"
                    placeholder="you@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password" className="auth-label">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <Lock className="auth-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    className="auth-input auth-input--password"
                    placeholder={
                      mode === "sign-up"
                        ? "Min 6 characters"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={
                      mode === "sign-up" ? "new-password" : "current-password"
                    }
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>
                      {mode === "sign-in" ? "Sign In" : "Create Account"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-toggle-text">
              {mode === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={toggleMode}
              >
                {mode === "sign-in" ? "Sign Up" : "Sign In"}
              </button>
            </p>

            <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: "var(--lv-border-light)" }}>
              <Link
                href={`/auth/verify-otp${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-orange-600 transition-colors font-medium"
              >
                <KeyRound className="h-3.5 w-3.5 text-orange-600" />
                <span>Have a confirmation code? Verify OTP</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
