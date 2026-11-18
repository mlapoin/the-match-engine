'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileSheet from '../components/ProfileSheet';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [myIds, setMyIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileChar, setProfileChar] = useState(null);
  const [profileMatchId, setProfileMatchId] = useState(null);
  const [myCharacter, setMyCharacter] = useState(null);

  async function openProfile(charId, matchId) {
    const res = await fetch(`/api/characters/${charId}`);
    const data = await res.json();
    if (data.character) {
      setProfileChar(data.character);
      setProfileMatchId(matchId);
    }
  }

  async function handleRemove() {
    if (!profileMatchId) return;
    if (!confirm(`Remove ${profileChar?.name || 'this match'}? This deletes your match and messages.`)) return;
    await fetch(`/api/matches/${profileMatchId}`, { method: 'DELETE' });
    setProfileChar(null);
    setProfileMatchId(null);
    loadMatches();
  }

  async function loadMatches() {
    const activeId = localStorage.getItem('activeCharacterId');
    const res = await fetch(activeId ? `/api/matches?character_id=${activeId}` : '/api/matches');
    const data = await res.json();
    setMatches(data.matches || []);
    setMyIds(data.myIds || []);
    setLoading(false);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status !== 'authenticated') return;

    fetch('/api/characters')
      .then(r => r.json())
      .then(data => {
        const chars = data.characters || [];
        if (chars.length === 0) return;
        const saved = localStorage.getItem('activeCharacterId');
        const active = saved ? chars.find(c => c.id == saved) : null;
        setMyCharacter(active || chars[0]);
      });

    loadMatches();

    let interval = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(loadMatches, 15000);
    };
    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadMatches();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [status]);

  if (status === 'loading' || loading) return null;

  const needsPhotoReupload = !!myCharacter?.profile_pic?.includes('cloudinary.com');

  if (needsPhotoReupload) {
    return (
      <div style={{ height: '100dvh', background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <i className="ti ti-photo-off" style={{ fontSize: '40px', color: '#fd3b6a', marginBottom: '16px' }} />
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: '0 0 10px' }}>Update your photos to continue</h1>
        <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px', maxWidth: '300px' }}>
          Your photos didn't survive our hosting migration. Re-upload one to see your chats and matches again. Everything's still there.
        </p>
        <button
          onClick={() => router.push(`/edit-character/${myCharacter.id}`)}
          style={{ background: '#fd3b6a', border: 'none', borderRadius: '24px', padding: '13px 32px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
        >
          Fix now
        </button>
      </div>
    );
  }

  const processedMatches = matches.map(m => {
    const myId = myIds.find(id => id === m.char1_id || id === m.char2_id);
    const other = myId === m.char1_id
      ? { id: m.char2_id, name: m.char2_name, profile_pic: m.char2_pic, match_id: m.id, x_handle: m.char2_handle }
      : { id: m.char1_id, name: m.char1_name, profile_pic: m.char1_pic, match_id: m.id, x_handle: m.char1_handle };
    return { ...m, other_character: other, match_id: m.id };
  });

  const newMatches = processedMatches.filter(m => !m.last_message);
  const conversations = processedMatches.filter(m => m.last_message);

  function getLastMessageStyle(m) {
    const iSentLast = myIds.includes(m.last_sender_id);
    if (iSentLast) {
      return { color: '#aaa', fontWeight: '400', yourTurn: false };
    }
    const isUnread = !m.last_message_read_at;
    return {
      color: isUnread ? '#111' : '#aaa',
      fontWeight: isUnread ? '600' : '400',
      yourTurn: true,
      unread: isUnread,
    };
  }

  const Avatar = ({ char, unread }) => (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#b71c1c,#e53935)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#fff', boxShadow: 'none' }}>
        {char.profile_pic
          ? <img src={char.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : char.name[0]
        }
      </div>
      {unread && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: '#fd3b6a', border: '2px solid #fff' }} />}
    </div>
  );

  const MatchCard = ({ m }) => (
    <div onClick={() => openProfile(m.other_character.id, m.match_id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: '80px', height: '90px', borderRadius: '14px', overflow: 'hidden', background: '#2a2a2a', boxShadow: 'none' }}>
        {m.other_character.profile_pic
          ? <img src={m.other_character.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#fff' }}>{m.other_character.name[0]}</div>
        }
        <div style={{ position: 'absolute', top: '6px', right: '6px', width: '10px', height: '10px', borderRadius: '50%', background: '#fd3b6a', border: '1.5px solid #E3E0E0' }} />
      </div>
      <div style={{ fontSize: '12px', fontWeight: '700', color: '#111', fontFamily: 'Nunito, sans-serif' }}>{m.other_character.name.split(' ')[0]}</div>
    </div>
  );

  const bottomNav = (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '390px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 20px', background: '#fff', borderTop: '0.5px solid #eee', zIndex: 50 }}>
      {[['ti-flame', 'Swipe', '/swipe', false], ['ti-heart', 'Likes', '/likes', false], ['ti-message-circle', 'Chat', '/chat', true], ['ti-user', 'Profile', '/profile', false]].map(([icon, label, href, active]) => (
        <div key={label} onClick={() => router.push(href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <i className={`ti ${icon}`} style={{ fontSize: '22px', color: active ? '#111' : '#aaa' }} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: active ? '#111' : '#aaa', fontFamily: 'Nunito, sans-serif' }}>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#E3E0E0', width: '100%', height: '100dvh', overflow: 'hidden', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>

      <div style={{ padding: '24px 16px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: '32px', fontWeight: '900', color: '#111' }}>Chat</div>
      </div>

      {newMatches.length > 0 && (
        <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111', marginBottom: '12px' }}>New Matches</div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {newMatches.map(m => <MatchCard key={m.match_id} m={m} />)}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', flex: 1, minHeight: 0, paddingBottom: '80px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ fontSize: '18px', fontWeight: '900', color: '#111', padding: '20px 16px 16px' }}>Messages</div>

        {conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#aaa', fontSize: '14px' }}>No messages yet — start swiping!</div>
        )}

        {conversations.map((m) => {
          const style = getLastMessageStyle(m);
          return (
            <div key={m.match_id} onClick={() => router.push(`/chat/${m.match_id}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0', cursor: 'pointer' }}>
              <Avatar char={m.other_character} unread={style.unread} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#111', fontFamily: 'Nunito, sans-serif' }}>{m.other_character.name}</span>
                <div style={{ fontSize: '13px', color: style.color, fontWeight: style.fontWeight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Nunito, sans-serif' }}>{m.last_message}</div>
              </div>
              {style.yourTurn && (
                <div style={{ background: '#111', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'Nunito, sans-serif' }}>Your Turn</div>
              )}
            </div>
          );
        })}
      </div>

      {profileChar && (
        <ProfileSheet
          char={profileChar}
          onClose={() => { setProfileChar(null); setProfileMatchId(null); }}
          onMessage={() => router.push(`/chat/${profileMatchId}`)}
          onRemove={handleRemove}
        />
      )}

      {bottomNav}
    </div>
  );
}