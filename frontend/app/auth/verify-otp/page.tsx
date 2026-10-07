"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";
import {
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const tokenHashParam = searchParams.get("token_hash");
  const typeParam = searchParams.get("type") as "signup" | "email" | null;

  const { verifyOtp, verifyTokenHash, resendOtp, user } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If user is already authenticated, redirect to workstation
  useEffect(() => {
    if (user && !isVerified) {
      router.push("/");
    }
  }, [user, isVerified, router]);

  // Handle direct link verification via token_hash (from Supabase confirmation emails)
  useEffect(() => {
    if (tokenHashParam && !isVerified) {
      setLoading(true);
      verifyTokenHash(tokenHashParam, typeParam || "signup").then(({ error: tokenErr }) => {
        setLoading(false);
        if (tokenErr) {
          setError(tokenErr.message || "Invalid or expired confirmation link.");
        } else {
          setIsVerified(true);
          setSuccess("Email successfully confirmed! Redirecting to workstation...");
          setTimeout(() => {
            router.push("/");
          }, 1200);
        }
      });
    }
  }, [tokenHashParam, typeParam, verifyTokenHash, isVerified, router]);

  // Focus the first input on initial mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Sync email from search params if updated
  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

  // Resend cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Handle individual digit input change
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, "");

    const newOtp = [...otp];
    if (cleanValue.length > 0) {
      // Pick the last entered digit
      newOtp[index] = cleanValue.slice(-1);
      setOtp(newOtp);
      setError(null);

      // Advance focus to next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  // Handle keyboard navigation (backspace, arrows)
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous box if current is already empty
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event (e.g., pasting "123456")
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    setError(null);

    // Focus on the next empty box or the last box
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Submit OTP verification
  const handleVerify = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault();
      const code = otp.join("");

      if (!email.trim()) {
        setError("Please enter the email address for verification.");
        return;
      }

      if (code.length !== 6) {
        setError("Please enter all 6 digits of the confirmation code.");
        return;
      }

      setError(null);
      setSuccess(null);
      setLoading(true);

      const { error: verifyErr } = await verifyOtp(email.trim(), code, "signup");

      if (verifyErr) {
        // Also try email verification type as fallback
        const { error: secondAttemptErr } = await verifyOtp(email.trim(), code, "email");
        if (secondAttemptErr) {
          setError(verifyErr.message || "Invalid or expired code. Please try again.");
          setLoading(false);
          return;
        }
      }

      setIsVerified(true);
      setSuccess("Email successfully confirmed! Redirecting to workstation...");
      setLoading(false);

      setTimeout(() => {
        router.push("/");
      }, 1200);
    },
    [otp, email, verifyOtp, router],
  );

  // Resend confirmation code
  const handleResend = useCallback(async () => {
    if (countdown > 0 || resending) return;
    if (!email.trim()) {
      setError("Please specify an email address to resend the code.");
      return;
    }

    setResending(true);
    setError(null);
    setSuccess(null);

    const { error: resendErr } = await resendOtp(email.trim(), "signup");
    setResending(false);

    if (resendErr) {
      setError(resendErr.message || "Failed to resend code. Please try again later.");
    } else {
      setSuccess("A fresh 6-digit confirmation code has been dispatched to your email.");
      setCountdown(60);
    }
  }, [countdown, resending, email, resendOtp]);

  const isComplete = otp.every((digit) => digit.length === 1);

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
              Secure Account
              <br />
              Verification
            </h2>
            <p className="auth-branding__sub">
              To safeguard clinical data integrity and enforce HIPAA-conscious audit trails,
              we require two-step email confirmation before accessing patient analytics.
            </p>

            <div className="auth-branding__features">
              <div className="auth-feature-pill">
                <ShieldCheck className="h-4 w-4" />
                <span>Audit Logged</span>
              </div>
              <div className="auth-feature-pill">
                <Sparkles className="h-4 w-4" />
                <span>Encrypted Session</span>
              </div>
            </div>

            <div className="auth-branding__disclaimer">
              <p>
                LumiVue authenticates through Supabase Auth with Row Level Security.
                Session credentials are tokenized and protected under industry-standard cryptographic protocols.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: OTP Verification Card */}
        <div className="auth-card-panel">
          <div className="auth-card">
            {/* Header with back link */}
            <div className="mb-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            <div className="auth-card__header">
              <div className="auth-otp-badge">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Two-Step Confirmation</span>
              </div>
              <h1 className="auth-card__title">Check Your Inbox</h1>
              <p className="auth-card__subtitle">
                Enter the 6-digit confirmation code sent to confirm your LumiVue account.
              </p>
            </div>

            {/* Email display / edit box */}
            <div className="auth-otp-email-box">
              <div className="flex items-center gap-2 truncate">
                <Mail className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="auth-otp-email-text truncate">
                  {email || "your-email@example.com"}
                </span>
              </div>
              <Link
                href="/auth"
                className="text-[11px] font-semibold text-orange-600 hover:underline shrink-0"
              >
                Change
              </Link>
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

            <form onSubmit={handleVerify} className="auth-form">
              {/* 6 Digit Input Grid */}
              <div className="auth-field">
                <label className="auth-label">6-Digit Confirmation Code</label>
                <div className="auth-otp-inputs">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className={`auth-otp-box ${digit ? "auth-otp-box--filled" : ""}`}
                      autoComplete="one-time-code"
                      aria-label={`Digit ${idx + 1}`}
                      disabled={loading || isVerified}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || !isComplete || isVerified}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : isVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verified!</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Enter Workstation</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend section */}
            <div className="auth-otp-resend">
              <span className="text-neutral-500 text-xs">Didn&apos;t receive the code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending || isVerified}
                className="auth-otp-resend-btn"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`}
                />
                <span>
                  {countdown > 0
                    ? `Resend in ${countdown}s`
                    : resending
                    ? "Sending..."
                    : "Resend Code"}
                </span>
              </button>
            </div>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-toggle-text">
              Already confirmed?{" "}
              <Link href="/auth" className="auth-toggle-btn">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <div className="auth-loading__inner">
            <div className="auth-loading__spinner" />
            <p className="auth-loading__text">Loading verification...</p>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
