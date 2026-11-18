'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HouseRules from '../components/HouseRules';

// Optional backdrop image for the auth screens (e.g. '/backdrop.jpg').
// Leave blank to use the plain dark background.
const BACKDROP_URL = '';

const wrapStyle = { width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const inputStyle = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '24px', padding: '14px 18px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', background: '#fd3b6a', border: 'none', borderRadius: '24px', padding: '15px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginTop: '18px' };

// Shared shell: photo backdrop + gradient, content pinned to the bottom.
function Backdrop({ children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: '#1a1a1a', fontFamily: 'Nunito, sans-serif' }}>
      {BACKDROP_URL && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={BACKDROP_URL} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div
        style={{
          position: 'relative',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px 36px',
          boxSizing: 'border-box',
          background: BACKDROP_URL
            ? 'linear-gradient(180deg, rgba(26,26,26,0) 0%, rgba(26,26,26,0.12) 28%, rgba(26,26,26,0.55) 46%, rgba(26,26,26,0.93) 68%, rgba(26,26,26,1) 100%)'
            : 'none',
        }}
      >
        {/* marginTop:auto pins content to the bottom without clipping it
            on short screens the way justify-content:flex-end would. */}
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [agreedRules, setAgreedRules] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password || loading) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <Backdrop>
        <div style={{ ...wrapStyle, textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0 }}>Check your email</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '10px 0 0' }}>
            We sent a verification link to <span style={{ color: '#fff', fontWeight: '700' }}>{email}</span>. Click it to activate your account.
          </p>
          <a href="/login" style={{ color: '#fd3b6a', fontSize: '13px', textDecoration: 'none', fontWeight: '700', marginTop: '18px', display: 'inline-block' }}>Back to sign in</a>
        </div>
      </Backdrop>
    );
  }

  return (
    <Backdrop>
      {!agreedRules && <HouseRules mode="agree" onAgree={() => setAgreedRules(true)} onDecline={() => router.push('/login')} />}
      <div style={wrapStyle}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ color: '#fff', fontSize: '34px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0, letterSpacing: '-0.5px' }}>Match Engine</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: '500', margin: '8px 0 0' }}>Create your account</p>
        </div>

        {error && (
          <p style={{ width: '100%', color: '#ff8a9e', fontSize: '13px', textAlign: 'center', background: 'rgba(253,59,106,0.12)', padding: '11px', borderRadius: '20px', marginBottom: '14px', boxSizing: 'border-box' }}>
            {error}
          </p>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ color: '#fd3b6a', fontSize: '12px', fontWeight: '700', marginBottom: '-4px', paddingLeft: '2px' }}>
            Email <span>*</span>
          </label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            style={inputStyle}
          />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '-4px 0 0', paddingLeft: '2px' }}>
            No one will see your email but you.
          </p>
          <label style={{ color: '#fd3b6a', fontSize: '12px', fontWeight: '700', marginBottom: '-4px', paddingLeft: '2px' }}>
            Password <span>*</span>
          </label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            style={inputStyle}
          />
        </div>

        <button onClick={handleSignup} disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginTop: '22px' }}>
          Already have an account? <a href="/login" style={{ color: '#fd3b6a', textDecoration: 'none', fontWeight: '700' }}>Sign in</a>
        </p>
      </div>
    </Backdrop>
  );
}