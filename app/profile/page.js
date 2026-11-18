'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileSheet from '../components/ProfileSheet';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myCharacter, setMyCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  // One-time notice, remembered per device via localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('seenReportNotice')) setShowNotice(true);
  }, []);

  function dismissNotice() {
    try { localStorage.setItem('seenReportNotice', '1'); } catch {}
    setShowNotice(false);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetch('/api/characters')
        .then(r => r.json())
        .then(data => {
          if (data.characters.length === 0) router.push('/create-character');
          else {
            setCharacters(data.characters);
            const saved = localStorage.getItem('activeCharacterId');
            const active = saved ? data.characters.find(c => c.id == saved) : null;
            setMyCharacter(active || data.characters[0]);
          }
        });
    }
  }, [status]);

  function switchCharacter(char) {
    if (char.id === myCharacter.id) return;
    try { localStorage.setItem('activeCharacterId', char.id); } catch {}
    setMyCharacter(char);
  }

  if (status === 'loading' || !myCharacter) return null;

  const bottomNav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '390px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 20px', background: '#E3E0E0', borderTop: '0.5px solid #ccc', zIndex: 50 }}>
      {[['ti-flame', 'Swipe', '/swipe', false], ['ti-heart', 'Likes', '/likes', false], ['ti-message-circle', 'Chat', '/chat', false], ['ti-user', 'Profile', '/profile', true]].map(([icon, label, href, active]) => (
        <div key={label} onClick={() => router.push(href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <i className={`ti ${icon}`} style={{ fontSize: '22px', color: active ? '#111' : '#aaa' }} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: active ? '#111' : '#aaa', fontFamily: 'Nunito, sans-serif' }}>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#E3E0E0', maxWidth: '390px', margin: '0 auto', height: '100dvh', overflow: 'hidden', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: '800', color: '#fff' }}>
          {myCharacter.profile_pic
            ? <img src={myCharacter.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : myCharacter.name[0]
          }
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '80px', justifyContent: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#111', lineHeight: 1 }}>{myCharacter.name}</div>
          <div onClick={() => router.push(`/edit-character/${myCharacter.id}`)} style={{ background: '#1a1a1a', borderRadius: '30px', padding: '8px 20px', color: '#fff', fontSize: '14px', fontWeight: '800', width: 'fit-content', cursor: 'pointer', lineHeight: 1 }}>Edit profile</div>
        </div>
        <div onClick={() => router.push('/settings')} style={{ position: 'absolute', top: '24px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
          <i className="ti ti-settings" style={{ fontSize: '17px', color: '#111' }} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.08)', margin: '0 16px 16px', flexShrink: 0 }} />

      <div style={{ padding: '0 12px', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: showNotice ? '155px' : '80px' }}>

        {/* Features label */}
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingLeft: '2px' }}>Features</div>

        {/* Feature cards */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>

          {/* My Roster */}
          <div style={{ background: '#fff', borderRadius: '14px', flex: 1, padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative' }}>
            <div onClick={() => setRosterOpen(o => !o)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%' }}>
              <i className="ti ti-chevron-down" style={{ position: 'absolute', top: '7px', right: '7px', fontSize: '12px', color: '#ccc', transition: 'transform 0.2s', transform: rosterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#4a90e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-users" style={{ fontSize: '18px', color: '#fff' }} />
              </div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#111', textAlign: 'center' }}>My Roster</div>
            </div>

            {rosterOpen && (
              <div style={{ width: '100%', borderTop: '0.5px solid #f0f0f0', paddingTop: '10px' }}>
                <div style={{ fontSize: '9px', color: '#aaa', textAlign: 'center', marginBottom: '8px' }}>Tap to switch who you're swiping as</div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '2px 4px 6px', scrollbarWidth: 'none' }}>
                  {characters.map(c => {
                    const isActive = c.id === myCharacter.id;
                    return (
                      <div key={c.id} onClick={() => switchCharacter(c)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, cursor: 'pointer', width: '56px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: '#fff', boxShadow: isActive ? '0 0 0 3px #fd3b6a' : '0 0 0 1px #eee' }}>
                          {c.profile_pic
                            ? <img src={c.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : c.name[0]
                          }
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: isActive ? '800' : '600', color: isActive ? '#111' : '#aaa', textAlign: 'center', maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      </div>
                    );
                  })}
                  <div onClick={() => router.push('/create-character')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, cursor: 'pointer', width: '56px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1.5px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-plus" style={{ fontSize: '18px', color: '#aaa' }} />
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#aaa' }}>New</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Preview my profile */}
        <div onClick={() => setPreviewOpen(true)} style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ti ti-eye" style={{ fontSize: '18px', color: '#fd3b6a' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>Preview my profile</span>
          </div>
          <i className="ti ti-chevron-right" style={{ fontSize: '16px', color: '#ccc' }} />
        </div>


      </div>

      {previewOpen && (
        <ProfileSheet
          char={myCharacter}
          onClose={() => setPreviewOpen(false)}
          previewMode
        />
      )}

      {showNotice && (
        <div style={{ position: 'fixed', bottom: '86px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '390px', padding: '0 12px', boxSizing: 'border-box', zIndex: 60 }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 18px rgba(0,0,0,0.28)' }}>
            <i className="ti ti-shield-check" style={{ fontSize: '18px', color: '#fd3b6a', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, flex: 1 }}>
              <span style={{ fontWeight: '800', color: '#fff' }}>New:</span> Use the report button to keep Match Engine fun and clean! Review the House Rules in settings to refresh on what is and isn't reportable/allowed. All it takes is ONE report!
            </div>
            <div onClick={dismissNotice} aria-label="Dismiss" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px', cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: '2px 4px' }}>&times;</div>
          </div>
        </div>
      )}

      {bottomNav}
    </div>
  );
}