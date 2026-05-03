import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, #7c6aff, #ff6ab0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>TaskFlow</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Sign in to your workspace</p>
        </div>

        <div className="card fade-in">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign up</Link>
          </div>

          {/* Demo hint */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(124,106,255,0.08)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', border: '1px solid rgba(124,106,255,0.15)' }}>
            <strong style={{ color: 'var(--accent)' }}>Demo:</strong> Create an account to get started instantly.
          </div>
        </div>
      </div>
    </div>
  );
}
