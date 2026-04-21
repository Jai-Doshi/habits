import { useState, useMemo } from 'react';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', bars: [] };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { label: 'Too short',  cls: '' },
    { label: 'Weak',       cls: 'weak' },
    { label: 'Fair',       cls: 'fair' },
    { label: 'Good',       cls: 'good' },
    { label: 'Strong',     cls: 'strong' },
    { label: 'Very strong',cls: 'strong' },
  ];

  const filled = Math.max(1, Math.min(score, 4));
  const bars = Array.from({ length: 4 }, (_, i) => i < filled ? levels[score]?.cls || '' : '');

  return { score, label: levels[Math.min(score, 5)].label, bars };
}

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter',       test: (p) => /[A-Z]/.test(p) },
  { label: 'Number',                 test: (p) => /[0-9]/.test(p) },
];

export default function SignupPage({ onSwitchToLogin }) {
  const { signUp, isDemo } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2) e.fullName = 'At least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters required';
    else if (strength.score < 2) e.password = 'Please choose a stronger password';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName.trim(),
    });

    if (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } else if (data?.user && !data?.session) {
      // Email confirmation required
      setSuccess(true);
    }
    // If session exists, AuthContext will handle redirect
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-root">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-grid-bg" />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo-wrap">
            <img src="/logo.png" alt="HabitFlow" className="auth-logo-img" />
            <div className="auth-logo-name">
              <span className="habit">Habit</span><span className="flow">Flow</span>
            </div>
          </div>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 800, color: '#f1f0ff', marginBottom: 8 }}>
            Check your inbox!
          </h2>
          <p style={{ color: 'rgba(160,158,192,0.8)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            We sent a confirmation link to <strong style={{ color: '#a855f7' }}>{form.email}</strong>.<br />
            Click it to verify your account and start tracking habits.
          </p>
          <div className="auth-banner success" style={{ marginBottom: 24, justifyContent: 'center' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            Account created successfully
          </div>
          <button className="auth-toggle-link" onClick={onSwitchToLogin} style={{ fontSize: 14 }}>
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />
      <div className="auth-grid-bg" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <img src="/logo.png" alt="HabitFlow" className="auth-logo-img" />
          <div className="auth-logo-name">
            <span className="habit">Habit</span><span className="flow">Flow</span>
          </div>
        </div>

        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-subheading">Start building better habits today — it's free</p>

        {/* Demo notice */}
        {isDemo && (
          <div className="auth-demo-notice">
            ⚠️ <strong>Demo mode.</strong> Configure Supabase to enable real accounts.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="auth-banner error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-name">Full Name</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                id="signup-name"
                type="text"
                className={`auth-input ${errors.fullName ? 'error' : ''}`}
                placeholder="Alex Morgan"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.fullName && <span className="auth-field-error"><AlertCircle size={12} />{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-email">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="signup-email"
                type="email"
                className={`auth-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="auth-field-error"><AlertCircle size={12} />{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="signup-password"
                type={showPw ? 'text' : 'password'}
                className={`auth-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="auth-field-error"><AlertCircle size={12} />{errors.password}</span>}

            {/* Strength meter */}
            {form.password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {strength.bars.map((cls, i) => (
                    <div key={i} className={`strength-bar ${cls}`} />
                  ))}
                </div>
                <div className="strength-label" style={{
                  color: ['','#ef4444','#f59e0b','#3b82f6','#10b981','#10b981'][strength.score] || 'rgba(107,105,144,0.8)'
                }}>
                  {strength.label}
                </div>
              </div>
            )}

            {/* Requirements checklist */}
            {form.password && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {REQUIREMENTS.map(req => {
                  const met = req.test(form.password);
                  return (
                    <div key={req.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                      <Check size={11} style={{ color: met ? '#10b981' : 'rgba(107,105,144,0.4)', flexShrink: 0 }} />
                      <span style={{ color: met ? '#6ee7b7' : 'rgba(107,105,144,0.6)' }}>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`auth-input ${errors.confirm ? 'error' : form.confirm && form.confirm === form.password ? '' : ''}`}
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(p => !p)}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm && <span className="auth-field-error"><AlertCircle size={12} />{errors.confirm}</span>}
            {!errors.confirm && form.confirm && form.confirm === form.password && (
              <span style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={12} /> Passwords match
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            id="signup-submit-btn"
            style={{ marginTop: 8 }}
          >
            {loading
              ? <><div className="auth-spinner" /> Creating account...</>
              : <>Create Account <ArrowRight size={16} /></>
            }
          </button>
        </form>

        {/* Terms */}
        <p className="auth-terms" style={{ marginTop: 16 }}>
          By creating an account, you agree to our{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>

        {/* Switch to login */}
        <div className="auth-toggle" style={{ marginTop: 20 }}>
          Already have an account?{' '}
          <button className="auth-toggle-link" onClick={onSwitchToLogin} id="switch-to-login">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
