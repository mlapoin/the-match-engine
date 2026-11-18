'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const pageStyle = { minHeight: '100dvh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif', padding: '20px', boxSizing: 'border-box' };
const wrapStyle = { width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '14px 18px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', background: '#fd3b6a', border: 'none', borderRadius: '24px', padding: '15px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginTop: '18px' };

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!password) return setError('Please enter a password');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (loading) return;

    setLoading(true);
    setError('');
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error);
    else setDone(true);
  }

  if (done) {
    return (
      <div style={{ ...wrapStyle, textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0 }}>Password reset!</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '10px 0 0' }}>Your password has been updated. You can now sign in.</p>
        <button onClick={() => router.push('/login')} style={buttonStyle}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>

      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0 }}>Reset password</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: '500', margin: '8px 0 0' }}>Enter your new password</p>
      </div>

      {error && (
        <p style={{ width: '100%', color: '#ff8a9e', fontSize: '13px', textAlign: 'center', background: 'rgba(253,59,106,0.12)', padding: '11px', borderRadius: '20px', marginBottom: '14px', boxSizing: 'border-box' }}>
          {error}
        </p>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
          style={inputStyle}
        />
      </div>

      <button onClick={handleReset} disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}>
        {loading ? 'Resetting…' : 'Reset password'}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={pageStyle}>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
