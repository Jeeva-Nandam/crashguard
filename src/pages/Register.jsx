import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Login.css';
import './Register.css';

export default function Register() {
  const [step, setStep] = useState(0); // 0=form, 1=otp
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone_number: '', role: 'Founder'
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const toast = useToast();
  const nav = useNavigate();
  const { login } = useAuth();

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── OTP input handlers ──────────────────────────────────────────────────────
  const handleOtp = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Step 1: Register → backend creates user + sends OTP ────────────────────
  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', form);
      toast('Check your email for the 6-digit verification code.', 'success');
      setStep(1);
    } catch (err) {
      toast(err.response?.data?.detail || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP → mark email verified → login → onboarding ──────────
  const verify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast('Enter all 6 digits.', 'error');
    setLoading(true);
    try {
      // Verify OTP with backend — this marks is_email_verified = true
      await API.post('/auth/verify-otp', { email: form.email, otp: code });
      toast('Email verified!', 'success');

      // Now log in (backend allows login only after verification)
      await login(form.email, form.password);
      nav('/onboarding');
    } catch (err) {
      toast(err.response?.data?.detail || 'Invalid code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const resend = async () => {
    if (resendCooldown > 0) return;
    try {
      await API.post('/auth/send-otp', { email: form.email });
      toast('New code sent to your email.', 'info');
      let c = 30;
      setResendCooldown(c);
      const t = setInterval(() => {
        c--;
        setResendCooldown(c);
        if (c <= 0) clearInterval(t);
      }, 1000);
    } catch {
      toast('Failed to resend. Try again.', 'error');
    }
  };

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
          <h1>Predict.<br /><span className="accent-text">Prevent.</span><br />Survive.</h1>
          <p>Join founders who use real-time financial intelligence to stay ahead of cash crises.</p>
        </div>
        <div className="feature-list">
          {['Revenue & expense trend analysis', 'Customer churn risk scoring', 'Crash date prediction', 'AI-powered recommendations'].map(f => (
            <div key={f} className="feature-item">
              <span className="feature-dot">✦</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right animate-fadeUp">
        <div className="auth-card">

          {/* Step indicator */}
          <div className="step-indicator">
            {['Account', 'Verify'].map((s, i) => (
              <div key={s} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
              Step {step + 1} of 2
            </span>
          </div>

          {/* ── Step 0: Registration form ── */}
          {step === 0 && (
            <>
              <div className="auth-card-header">
                <h2>Create account</h2>
                <p>Start predicting your financial future</p>
              </div>
              <form onSubmit={register} className="auth-form">
                <div className="field-row">
                  <div className="field">
                    <label>Full name</label>
                    <input name="full_name" placeholder="Arjun Kumar" value={form.full_name} onChange={handle} required />
                  </div>
                  <div className="field">
                    <label>Role</label>
                    <select name="role" value={form.role} onChange={handle}>
                      <option>Founder</option>
                      <option>Finance</option>
                      <option>Operator</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" placeholder="you@startup.com" value={form.email} onChange={handle} required />
                </div>
                <div className="field">
                  <label>Phone number</label>
                  <input name="phone_number" type="tel" placeholder="+91 98765 43210" value={form.phone_number} onChange={handle} required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input name="password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={handle} required />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Sending code…</> : 'Continue →'}
                </button>
              </form>
              <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
              </div>
            </>
          )}

          {/* ── Step 1: OTP verification ── */}
          {/* {step === 1 && (
            <>
              <div className="auth-card-header">
                <div className="otp-badge">📬</div>
                <h2>Verify your email</h2>
                <p>
                  We sent a 6-digit code to{' '}
                  <strong style={{ color: 'var(--text-1)' }}>{form.email}</strong>
                </p>
              </div>
              <form onSubmit={verify} className="auth-form">
                <div className="otp-row" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtp(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={loading || otp.join('').length < 6}
                >
                  {loading
                    ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying…</>
                    : 'Verify & continue →'}
                </button>

                <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
                  Didn't receive it?{' '}
                  <button type="button" className="link-btn" onClick={resend} disabled={resendCooldown > 0}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
              <div className="auth-footer">
                <button type="button" className="link-btn" onClick={() => { setStep(0); setOtp(['','','','','','']); }}>
                  ← Use a different email
                </button>
              </div>
            </>
          )} */}

          {step === 1 && (
  <>
    <div className="auth-card-header">
      <div className="otp-badge">📬</div>
      <h2>Verify your email</h2>
      <p>
        We sent a 6-digit code to{' '}
        <strong style={{ color: 'var(--text-1)' }}>{form.email}</strong>
      </p>
    </div>

    <form onSubmit={verify} className="auth-form">
      
      {/* OTP INPUTS */}
      <div className="otp-row" onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => otpRefs.current[i] = el}
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtp(e.target.value, i)}
            onKeyDown={e => handleOtpKey(e, i)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        className="btn btn-primary btn-full btn-lg"
        disabled={loading || otp.join('').length < 6}
      >
        {loading
          ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16 }} />
              Verifying…
            </>
          )
          : 'Verify & continue →'}
      </button>

      {/* RESEND */}
      <div className="otp-footer">
        Didn't receive it?{' '}
        <button
          type="button"
          className="link-btn"
          onClick={resend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend code'}
        </button>
      </div>
    </form>

    <div className="auth-footer">
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setStep(0);
          setOtp(['', '', '', '', '', '']);
        }}
      >
        ← Use a different email
      </button>
    </div>
  </>
)}

        </div>
      </div>
    </div>
  );
}
