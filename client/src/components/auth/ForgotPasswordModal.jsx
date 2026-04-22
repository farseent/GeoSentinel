import { useState, useRef, useEffect } from "react";
import { authAPI } from "../../utils/api";
import { validateEmail, validatePassword, validatePasswordMatch } from "../..//utils/validation";

export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const verifiedOtp = useRef("");

  const STEPS = ["email", "otp", "password", "done"];
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Send OTP ─────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authAPI.forgotPassword(email);
      setStep("otp");
      setResendTimer(30);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await authAPI.forgotPassword(email);
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to resend OTP.");
    }
  };

  // ── Step 2: OTP input handlers ────────────────────────────────
  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/, "");
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authAPI.verifyOtp(email, otpStr);
      verifiedOtp.current = otpStr;
      setStep("password");
    } catch (e) {
      setError(e.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ────────────────────────────────────
  const handleResetPassword = async () => {
    const pwValidation = validatePassword(password);
    if (!pwValidation.isValid) {
      setError(pwValidation.message);
      return;
    }
    const matchValidation = validatePasswordMatch(password, confirm);
    if (!matchValidation.isValid) {
      setError(matchValidation.message);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authAPI.resetPassword(email, verifiedOtp.current, password);
      setStep("done");
    } catch (e) {
      setError(e.response?.data?.message || "Reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full" >
      <div className="bg-white rounded-lg shadow-md w-full max-w-sm p-6">

        {/* Step dots */}
        {step !== "done" && (
          <div className="flex justify-center gap-2 mb-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === stepIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}

        {/* Email step */}
        {step === "email" && (
          <>
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-xl mx-auto mb-3">✉️</div>
            <h2 className="text-base font-medium text-center text-gray-900 mb-1">Forgot password?</h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Enter your account email and we'll send a one-time code.
            </p>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium mb-2 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>

            <button
              onClick={onClose}
              className="w-full text-sm text-gray-500 py-2 hover:text-blue-600"
            >
              Cancel
            </button>
          </>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <>
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-xl mx-auto mb-3">🔢</div>
            <h2 className="text-base font-medium text-center text-gray-900 mb-1">Check your inbox</h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-gray-700">{email}</span>.
              It expires in 10 minutes.
            </p>

            <div className="flex gap-2 justify-center mb-3" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  className="w-10 h-12 text-center text-lg font-medium border border-gray-300 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                />
              ))}
            </div>

            {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}

            <p className="text-xs text-gray-400 text-center mb-3">
              Didn't get it?{" "}
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className="text-blue-600 underline hover:text-blue-700 disabled:text-gray-300 disabled:no-underline"
              >
                {resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend"}
              </button>
            </p>

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium mb-2 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <button
              onClick={() => { setError(""); }}
              className="w-full text-sm text-gray-500 py-2 hover:text-blue-600"
            >
              Back
            </button>
          </>
        )}

        {/* Password step */}
        {step === "password" && (
          <>
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-xl mx-auto mb-3">🔒</div>
            <h2 className="text-base font-medium text-center text-gray-900 mb-1">Set new password</h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Min 8 chars with uppercase, lowercase, and a number.
            </p>

            <div className="relative mb-3">
              <input
                type={showPw ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-14 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-blue-600"
              >
                {showPw ? "hide" : "show"}
              </button>
            </div>

            <input
              type={showPw ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium mb-2 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>

            <button
              onClick={() => setError("")}
              className="w-full text-sm text-gray-500 py-2 hover:text-blue-600"
            >
              Back
            </button>
          </>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-2">
            <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center text-xl mx-auto mb-3">✅</div>
            <h2 className="text-base font-medium text-gray-900 mb-1">Password reset!</h2>
            <p className="text-sm text-gray-500 mb-5">
              Your password has been updated. Sign in with your new password.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Back to login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}