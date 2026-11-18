'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Optional backdrop image for the auth screens (e.g. '/backdrop.jpg').
// Leave blank to use the plain dark background.
const BACKDROP_URL = '';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password || loading) return;
    setLoading(true);
    setError('');
    setBanned(false);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res.error) {
      if (res.error.startsWith('BANNED: ')) {
        setBanned(true);
        setError(res.error.replace('BANNED: ', ''));
      } else if (res.error === 'Please verify your email before signing in') {
        setError(res.error);
      } else {
        setError('Invalid email or password');
      }
    } else {
      router.push('/swipe');
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ color: '#fff', fontSize: '34px', fontWeight: '900', fontFamily: 'Nunito, sans-serif', margin: 0, letterSpacing: '-0.5px' }}>Match Engine</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: '500', margin: '8px 0 0' }}>If we can find love, so can you.</p>
      </div>

      {verified && (
        <p style={{ width: '100%', color: '#7ee2a8', fontSize: '13px', textAlign: 'center', background: 'rgba(126,226,168,0.12)', padding: '11px', borderRadius: '20px', marginBottom: '14px', boxSizing: 'border-box' }}>
          Email verified! You can now sign in.
        </p>
      )}
      {error && (
        <div style={{ width: '100%', color: banned ? '#fff' : '#ff8a9e', fontSize: '13px', textAlign: 'center', background: banned ? '#3a0d16' : 'rgba(253,59,106,0.12)', padding: '13px', borderRadius: '14px', marginBottom: '14px', boxSizing: 'border-box' }}>
          {banned && <div style={{ fontWeight: '800', marginBottom: '4px', color: '#fd3b6a' }}>Account Banned</div>}
          {error}
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '24px', padding: '14px 18px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', width: '100%', boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '24px', padding: '14px 18px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: '100%', background: '#fd3b6a', border: 'none', borderRadius: '24px', padding: '15px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: loading ? 'default' : 'pointer', fontFamily: 'Nunito, sans-serif', marginTop: '18px', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginTop: '22px' }}>
        No account? <a href="/signup" style={{ color: '#fd3b6a', textDecoration: 'none', fontWeight: '700' }}>Sign up</a>
      </p>
      <p style={{ marginTop: '4px' }}>
        <a href="/forgot-password" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>Forgot password?</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
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
        {/* marginTop:auto pins the form to the bottom without clipping it
            on short screens the way justify-content:flex-end would. */}
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}