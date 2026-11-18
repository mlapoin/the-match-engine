'use client';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileSheet from '../../components/ProfileSheet';

export default function PublicCharacterPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [char, setChar] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [myCharacter, setMyCharacter] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [swipedMsg, setSwipedMsg] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch(`/api/characters/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.character) setChar(data.character);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));

    fetch('/api/characters')
      .then(r => r.json())
      .then(data => {
        const chars = data.characters || [];
        if (chars.length === 0) return;
        const saved = localStorage.getItem('activeCharacterId');
        const active = saved ? chars.find(c => c.id == saved) : null;
        setMyCharacter(active || chars[0]);
      });
  }, [status, params.id]);

  async function handleSwipe(direction) {
    if (!myCharacter || !char || swiping) return;
    setSwiping(true);
    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swiper_character_id: myCharacter.id,
          swiped_character_id: char.id,
          direction,
        }),
      });
      const data = await res.json();
      if (data.matched && data.matchId) {
        router.push(`/chat/${data.matchId}`);
        return;
      }
      setSwipedMsg(direction === 'right' ? 'Liked!' : 'Passed');
      setTimeout(() => router.push('/swipe'), 700);
    } catch {
      setSwiping(false);
    }
  }

  if (status === 'loading') return null;

  if (status !== 'authenticated') {
    return (
      <div style={{ minHeight: '100dvh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <div>
          <i className="ti ti-lock" style={{ fontSize: '40px', color: '#fd3b6a', marginBottom: '16px', display: 'block' }} />
          <p style={{ color: '#fff', fontSize: '17px', fontWeight: '700', margin: '0 0 18px' }}>Please login to Match Engine to view this profile.</p>
          <button
            onClick={() => router.push('/login')}
            style={{ background: '#fd3b6a', border: 'none', borderRadius: '24px', padding: '13px 32px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100dvh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <p style={{ color: '#888', fontSize: '15px' }}>This profile doesn't exist or has been removed.</p>
      </div>
    );
  }

  if (!char) return null;

  // Don't offer swipe buttons on your own shared profile, or before your
  // own character has loaded.
  const canSwipe = myCharacter && myCharacter.id !== char.id;

  return (
    <>
      {swipedMsg && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: '700', padding: '10px 20px', borderRadius: '20px' }}>
          {swipedMsg}
        </div>
      )}
      <ProfileSheet
        char={char}
        onClose={() => router.push('/swipe')}
        onLike={canSwipe ? () => handleSwipe('right') : undefined}
      />
    </>
  );
}