import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function LoginPage({ onSwitchToSignup }) {
  const { signIn, isDemo } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
    setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    const { error: err } = await signIn({ email: form.email, password: form.password });
    if (err) setError(err.message || 'Sign in failed. Please try again.');
    setLoading(false);
  };

  return (
    <div className="auth-root">
      {/* Animated background */}
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

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to continue your habit journey</p>

        {/* Demo mode notice */}
        {isDemo && (
          <div className="auth-demo-notice">
            ⚠️ <strong>Demo mode active.</strong> Configure Supabase in <code>.env</code> to enable real authentication.
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
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                className={`auth-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && (
              <span className="auth-field-error"><AlertCircle size={12} />{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className={`auth-input ${errors.password ? 'error' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPw(p => !p)} aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="auth-field-error"><AlertCircle size={12} />{errors.password}</span>
            )}
          </div>

          {/* Forgot password */}
          <button type="button" className="auth-forgot" id="forgot-password-btn">
            Forgot your password?
          </button>

          {/* Submit */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading
              ? <><div className="auth-spinner" /> Signing in...</>
              : <>Sign In <ArrowRight size={16} /></>
            }
          </button>
        </form>

        {/* Switch to signup */}
        <div className="auth-toggle" style={{ marginTop: 24 }}>
          Don't have an account?{' '}
          <button className="auth-toggle-link" onClick={onSwitchToSignup} id="switch-to-signup">
            Create one free
          </button>
        </div>
      </div>
    </div>
  );
}
