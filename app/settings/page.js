'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HouseRules from '../components/HouseRules';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [account, setAccount] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [showRules, setShowRules] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;

    fetch('/api/account')
      .then(r => r.json())
      .then(data => { if (data.account) setAccount(data.account); });

    fetch('/api/characters')
      .then(r => r.json())
      .then(data => {
        const chars = data.characters || [];
        setCharacters(chars);
        const saved = localStorage.getItem('activeCharacterId');
        if (saved && chars.find(c => c.id == saved)) setActiveId(saved);
        else if (chars.length > 0) setActiveId(String(chars[0].id));
      });
  }, [status]);

  function switchCharacter(id) {
    localStorage.setItem('activeCharacterId', String(id));
    setActiveId(String(id));
  }

  async function handleChangePassword() {
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwSaving(true);
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (!res.ok) {
      setPwError(data.error || 'Something went wrong');
      return;
    }
    setPwSuccess('Password updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwOpen(false);
  }

  async function handleDelete(id) {
    const res = await fetch('/api/characters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const remaining = characters.filter(c => c.id != id);
      setCharacters(remaining);
      setDeletingId(null);
      if (activeId == id) {
        if (remaining.length > 0) switchCharacter(remaining[0].id);
        else {
          localStorage.removeItem('activeCharacterId');
          setActiveId(null);
        }
      }
    }
  }

  if (status === 'loading' || status === 'unauthenticated') return null;

  const cardStyle = { background: '#fff', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
  const sectionLabel = { fontSize: '10px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 2px' };
  const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' };
  const inputStyle = { background: '#f0eeeb', border: 'none', borderRadius: '10px', padding: '12px 14px', color: '#111', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', width: '100%' };

  return (
    <div style={{ background: '#E3E0E0', maxWidth: '390px', margin: '0 auto', minHeight: '100vh', paddingBottom: '40px', fontFamily: 'Nunito, sans-serif' }}>

      {showRules && <HouseRules mode="view" onClose={() => setShowRules(false)} />}

      {/* Header */}
      <div style={{ padding: '24px 16px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div onClick={() => router.push('/profile')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: '18px', color: '#111' }} />
        </div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#111' }}>Settings</div>
      </div>

      <div style={{ padding: '0 12px' }}>

        {/* Account */}
        <div style={sectionLabel}>Account</div>
        <div style={{ ...cardStyle, marginBottom: '28px' }}>
          <div style={rowStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {account ? account.email : (session?.user?.email || '…')}
              </div>
            </div>
            {account && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, background: account.verified ? '#e8f9ee' : '#fdeef0', padding: '5px 10px', borderRadius: '20px' }}>
                <i className={`ti ${account.verified ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ fontSize: '14px', color: account.verified ? '#22a95a' : '#fd3b6a' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: account.verified ? '#22a95a' : '#fd3b6a' }}>{account.verified ? 'Verified' : 'Unverified'}</span>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 16px' }} />

          {/* Change password */}
          <div onClick={() => { setPwOpen(o => !o); setPwError(''); setPwSuccess(''); }} style={{ ...rowStyle, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="ti ti-lock" style={{ fontSize: '18px', color: '#111' }} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>Change password</span>
            </div>
            <i className={`ti ${pwOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: '16px', color: '#ccc' }} />
          </div>

          {pwOpen && (
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
              {pwError && <div style={{ fontSize: '12px', color: '#fd3b6a', fontWeight: '600' }}>{pwError}</div>}
              <button onClick={handleChangePassword} disabled={pwSaving} style={{ background: pwSaving ? '#ccc' : '#1a1a1a', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '800', cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                {pwSaving ? 'Saving…' : 'Update password'}
              </button>
            </div>
          )}

          {pwSuccess && !pwOpen && (
            <div style={{ padding: '0 16px 14px', fontSize: '12px', color: '#22a95a', fontWeight: '700' }}>{pwSuccess}</div>
          )}

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 16px' }} />

          {/* House rules */}
          <div onClick={() => setShowRules(true)} style={{ ...rowStyle, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="ti ti-file-text" style={{ fontSize: '18px', color: '#111' }} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>House rules</span>
            </div>
            <i className="ti ti-chevron-right" style={{ fontSize: '16px', color: '#ccc' }} />
          </div>
        </div>

        {/* Roster */}
        <div style={sectionLabel}>My Roster</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {characters.map(char => {
            const isActive = activeId == char.id;
            return (
              <div key={char.id} style={{ ...cardStyle, padding: '12px 14px', border: isActive ? '2px solid #fd3b6a' : '2px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div onClick={() => switchCharacter(char.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer', minWidth: 0 }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                      {char.profile_pic
                        ? <img src={char.profile_pic} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (char.name ? char.name[0] : '?')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</div>
                      {isActive
                        ? <div style={{ fontSize: '10px', fontWeight: '800', color: '#fd3b6a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
                        : <div style={{ fontSize: '11px', fontWeight: '700', color: '#aaa' }}>Tap to switch</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <div onClick={() => router.push(`/edit-character/${char.id}`)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f0eeeb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className="ti ti-pencil" style={{ fontSize: '15px', color: '#111' }} />
                    </div>
                    <div onClick={() => setDeletingId(char.id)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f0eeeb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className="ti ti-trash" style={{ fontSize: '15px', color: '#fd3b6a' }} />
                    </div>
                  </div>
                </div>

                {deletingId === char.id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '0.5px solid #f0f0f0' }}>
                    <div style={{ fontSize: '12px', color: '#777', marginBottom: '10px' }}>Delete <b>{char.name}</b>? This cannot be undone.</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setDeletingId(null)} style={{ flex: 1, background: '#f0eeeb', border: 'none', borderRadius: '10px', padding: '10px', color: '#888', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>Cancel</button>
                      <button onClick={() => handleDelete(char.id)} style={{ flex: 1, background: '#fd3b6a', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create new */}
          <div onClick={() => router.push('/create-character')} style={{ ...cardStyle, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: '2px dashed #ccc', boxShadow: 'none', background: 'transparent' }}>
            <i className="ti ti-plus" style={{ fontSize: '18px', color: '#111' }} />
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>Create new character</span>
          </div>
        </div>

        {/* Sign out */}
        <div onClick={() => signOut({ callbackUrl: '/login' })} style={{ ...cardStyle, marginTop: '20px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
          <i className="ti ti-logout" style={{ fontSize: '18px', color: '#fd3b6a' }} />
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#fd3b6a' }}>Sign out</span>
        </div>

      </div>
    </div>
  );
}
