'use client';
import { useState } from 'react';

const pageStyle = { minHeight: '100dvh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif', padding: '20px', boxSizing: 'border-box' };
const wrapStyle = { width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '14px 18px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', background: '#fd3b6a', border: 'none', borderRadius: '24px', padding: '15px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginTop: '18px' };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) return setError('Please enter your email');
    if (loading) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else setError('Something went wrong');
  }

  if (sent) {
    return (
      <div style={pageStyle}>
        <div style={{ ...wrapStyle, textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0 }}>Check your email</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '10px 0 0' }}>If that email exists we sent a reset link. Check your inbox.</p>
          <a href="/login" style={{ color: '#fd3b6a', fontSize: '13px', textDecoration: 'none', fontWeight: '700', marginTop: '18px', display: 'inline-block' }}>Back to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0 }}>Forgot password</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: '500', margin: '8px 0 0' }}>Enter your email and we'll send a reset link</p>
        </div>

        {error && (
          <p style={{ width: '100%', color: '#ff8a9e', fontSize: '13px', textAlign: 'center', background: 'rgba(253,59,106,0.12)', padding: '11px', borderRadius: '20px', marginBottom: '14px', boxSizing: 'border-box' }}>
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inputStyle}
        />

        <button onClick={handleSubmit} disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <a href="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none', textAlign: 'center', marginTop: '18px' }}>Back to sign in</a>
      </div>
    </div>
  );
}
