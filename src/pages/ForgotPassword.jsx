import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Login.css';
import './Register.css';

// 3 steps: enter email → verify OTP → set new password
export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({ new_password: '', confirm: '' });
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);
  const toast = useToast();
  const nav = useNavigate();

  // ── OTP helpers ─────────────────────────────────────────────────────────────
  const handleOtp = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) { setOtp(text.split('')); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  // ── Step 0: send OTP to email ────────────────────────────────────────────────
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      toast('Check your email for the reset code.', 'success');
      setStep(1);
    } catch {
      toast('Something went wrong. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: verify OTP ───────────────────────────────────────────────────────
  const verifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast('Enter all 6 digits.', 'error');
    // We just advance to step 2 — actual verification happens on submit with the new password
    // This gives better UX (one network call instead of two)
    setStep(2);
  };

  // ── Step 2: set new password ─────────────────────────────────────────────────
  const resetPassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      return toast('Passwords do not match.', 'error');
    }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', {
        email,
        otp: otp.join(''),
        new_password: passwords.new_password,
      });
      toast('Password reset successfully! Please sign in.', 'success');
      nav('/login');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Reset failed.';
      if (detail.toLowerCase().includes('otp') || detail.toLowerCase().includes('code')) {
        // OTP was wrong — send back to OTP step
        toast(detail, 'error');
        setOtp(['', '', '', '', '', '']);
        setStep(1);
      } else {
        toast(detail, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    await API.post('/auth/forgot-password', { email });
    toast('New code sent.', 'info');
    let c = 30;
    setResendCooldown(c);
    const t = setInterval(() => { c--; setResendCooldown(c); if (c <= 0) clearInterval(t); }, 1000);
  };

  const stepLabels = ['Email', 'Verify', 'New password'];

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="grid-overlay" />
      </div>

      <div className="auth-left animate-fadeIn">
        <div className="brand-mark">
          <div className="brand-icon">⬡</div>
          <span className="brand-name">CrashGuard</span>
        </div>
        <div className="hero-text">
          <h1>Reset your<br /><span className="accent-text">password.</span></h1>
          <p>We'll send a verification code to your email so you can set a new password securely.</p>
        </div>
      </div>

      <div className="auth-right animate-fadeUp">
        <div className="auth-card">

          {/* Step indicator */}
          <div className="step-indicator">
            {stepLabels.map((s, i) => (
              <div key={s} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
              Step {step + 1} of 3
            </span>
          </div>

          {/* Step 0 — enter email */}
          {step === 0 && (
            <>
              <div className="auth-card-header">
                <h2>Forgot password?</h2>
                <p>Enter your account email and we'll send a reset code.</p>
              </div>
              <form onSubmit={sendOtp} className="auth-form">
                <div className="field">
                  <label>Email address</label>
                  <input
                    type="email" placeholder="you@startup.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Sending…</> : 'Send reset code →'}
                </button>
              </form>
              <div className="auth-footer">
                <p>Remembered it? <Link to="/login">Sign in</Link></p>
              </div>
            </>
          )}

          {/* Step 1 — OTP */}
          {step === 1 && (
            <>
              <div className="auth-card-header">
                <div className="otp-badge">🔑</div>
                <h2>Enter the code</h2>
                <p>Sent to <strong style={{ color: 'var(--text-1)' }}>{email}</strong></p>
              </div>
              <form onSubmit={verifyOtp} className="auth-form">
                <div className="otp-row" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i} ref={el => otpRefs.current[i] = el}
                      className="otp-input" type="text" inputMode="numeric"
                      maxLength={1} value={digit}
                      onChange={e => handleOtp(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={otp.join('').length < 6}>
                  Continue →
                </button>
                <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
                  Didn't get it?{' '}
                  <button type="button" className="link-btn" onClick={resend} disabled={resendCooldown > 0}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
              <div className="auth-footer">
                <button type="button" className="link-btn" onClick={() => setStep(0)}>← Change email</button>
              </div>
            </>
          )}

          {/* Step 2 — new password */}
          {step === 2 && (
            <>
              <div className="auth-card-header">
                <div className="otp-badge">🔒</div>
                <h2>Set new password</h2>
                <p>Choose a strong password for your account.</p>
              </div>
              <form onSubmit={resetPassword} className="auth-form">
                <div className="field">
                  <label>New password</label>
                  <input
                    type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={passwords.new_password}
                    onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label>Confirm new password</label>
                  <input
                    type="password" placeholder="Repeat your new password"
                    value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                  {passwords.confirm && passwords.new_password !== passwords.confirm && (
                    <span style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4, display: 'block' }}>
                      Passwords do not match
                    </span>
                  )}
                </div>
                <button
                  type="submit" className="btn btn-primary btn-full btn-lg"
                  disabled={loading || !passwords.new_password || passwords.new_password !== passwords.confirm}
                >
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Resetting…</> : 'Reset password →'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
