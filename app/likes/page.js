'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import ProfileSheet from '../components/ProfileSheet';

export default function LikesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [likes, setLikes] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [matchedChar, setMatchedChar] = useState(null);
  const [matchedId, setMatchedId] = useState(null);
  const [profileChar, setProfileChar] = useState(null);

  async function openProfile(charId) {
    const res = await fetch(`/api/characters/${charId}`);
    const data = await res.json();
    if (data.character) setProfileChar(data.character);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const savedId = localStorage.getItem('activeCharacterId');
      fetch('/api/characters')
        .then(r => r.json())
        .then(data => {
          if (data.characters.length > 0) {
            const active = savedId ? data.characters.find(c => c.id == savedId) : null;
            setMyCharacter(active || data.characters[0]);
          }
        });
      fetch(savedId ? `/api/likes?character_id=${savedId}` : '/api/likes')
        .then(r => r.json())
        .then(data => setLikes(data.likes || []));
    }
  }, [status]);

  async function handleSwipe(likedCharId, direction) {
    if (!myCharacter) return;
    const res = await fetch('/api/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        swiper_character_id: myCharacter.id,
        swiped_character_id: likedCharId,
        direction,
      }),
    });
    const data = await res.json();
    if (data.matched) {
      const char = likes.find(l => l.swiper_character_id === likedCharId);
      setMatchedChar(char);
      setMatchedId(data.matchId);
    }
    setLikes(prev => prev.filter(l => l.swiper_character_id != likedCharId));
  }

  if (status === 'loading') return null;

  const needsPhotoReupload = !!myCharacter?.profile_pic?.includes('cloudinary.com');

  if (needsPhotoReupload) {
    return (
      <div style={{ height: '100dvh', background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <i className="ti ti-photo-off" style={{ fontSize: '40px', color: '#fd3b6a', marginBottom: '16px' }} />
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: '0 0 10px' }}>Update your photos to continue</h1>
        <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px', maxWidth: '300px' }}>
          Your photos didn't survive our hosting migration. Re-upload one to see your likes again. Everything's still there.
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

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: '#f0eeeb', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Match overlay */}
      {matchedChar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.97)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <p style={{ color: '#fd3b6a', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' }}>You Matched!</p>
          <h1 style={{ color: '#111', fontSize: '30px', fontWeight: '800', textAlign: 'center', lineHeight: 1.2, padding: '0 30px' }}>{myCharacter?.name} & {matchedChar.name} liked each other</h1>
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fd3b6a', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {myCharacter?.profile_pic ? <img src={myCharacter.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px', fontWeight: '800', color: '#111' }}>{myCharacter?.name[0]}</span>}
            </div>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fd3b6a', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-16px' }}>
              {matchedChar.profile_pic ? <img src={matchedChar.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px', fontWeight: '800', color: '#111' }}>{matchedChar.name[0]}</span>}
            </div>
          </div>
          {matchedChar.x_handle && (
            <p style={{ color: '#888', fontSize: '14px', textAlign: 'center' }}>
              Find them on X: <a href={`https://x.com/${matchedChar.x_handle}`} target="_blank" style={{ color: '#fd3b6a', textDecoration: 'none', fontWeight: '600' }}>@{matchedChar.x_handle}</a>
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
            <button onClick={() => router.push(matchedId ? `/chat/${matchedId}` : '/chat')} style={{ background: '#fd3b6a', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Send a message</button>
            <button onClick={() => setMatchedChar(null)} style={{ background: 'transparent', border: '1.5px solid #ddd', borderRadius: '12px', padding: '14px', color: '#888', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>See more likes</button>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 16px 10px', flexShrink: 0 }}>
        <h1 style={{ color: '#111', fontSize: '28px', fontWeight: '800', fontFamily: 'Nunito,sans-serif' }}>Likes</h1>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>Characters who liked you</p>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '80px' }}>
      {likes.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <p style={{ color: '#888', fontSize: '15px' }}>No likes yet — keep swiping!</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {likes.map(like => (
              <div key={like.swiper_character_id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: 'none' }}>
                <div onClick={() => openProfile(like.swiper_character_id)} style={{ width: '100%', height: '160px', background: '#eee', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                  {like.profile_pic
                    ? <img src={like.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#b71c1c,#e53935)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '800', color: '#fff' }}>{like.name[0]}</div>
                  }
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p onClick={() => openProfile(like.swiper_character_id)} style={{ color: '#111', fontSize: '15px', fontWeight: '700', margin: 0, cursor: 'pointer' }}>{like.name}{like.age ? `, ${like.age}` : ''}</p>
                  {like.x_handle && (
                    <p style={{ color: '#888', fontSize: '12px', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <i className="ti ti-brand-x" style={{ fontSize: '12px' }} />{like.x_handle}
                    </p>
                  )}
                  {like.location && (
                    <p style={{ color: '#888', fontSize: '12px', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <i className="ti ti-map-pin" style={{ fontSize: '12px' }} />{like.location}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleSwipe(like.swiper_character_id, 'left')}
                      style={{ flex: 1, background: '#fff0f0', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="ti ti-x" style={{ fontSize: '18px', color: '#fd3b6a' }} />
                    </button>
                    <button
                      onClick={() => handleSwipe(like.swiper_character_id, 'right')}
                      style={{ flex: 1, background: '#f0fff4', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="ti ti-heart" style={{ fontSize: '18px', color: '#4cd964' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {profileChar && (
        <ProfileSheet
          char={profileChar}
          onClose={() => setProfileChar(null)}
          onDecline={() => { handleSwipe(profileChar.id, 'left'); setProfileChar(null); }}
        />
      )}

      <BottomNav active="Likes" />
    </div>
  );
}