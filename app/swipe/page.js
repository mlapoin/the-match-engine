'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import ProfileSheet from '../components/ProfileSheet';

export default function SwipePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState([]);
  const [current, setCurrent] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [myCharacter, setMyCharacter] = useState(null);
  const [allMyChars, setAllMyChars] = useState([]);
  const [matched, setMatched] = useState(false);
  const [matchedChar, setMatchedChar] = useState(null);
  const [matchedId, setMatchedId] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [stampVisible, setStampVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [heartFlash, setHeartFlash] = useState(false);
  const [xFlash, setXFlash] = useState(false);
  const [swipeDir, setSwipeDir] = useState(null);
  const dragStart = useRef(null);
  // Everyone swiped in roughly the last minute, kept in localStorage so it
  // survives a full page reload, not just an in-app refresh. The actual
  // save to the server happens in the background and isn't awaited by the
  // swipe animation — so if someone reloads right after swiping, that save
  // might not have landed yet. This is the safety net: updated the instant
  // a swipe happens, zero network delay, so a reload can never show that
  // person again even if the server hasn't caught up. Entries older than a
  // minute are dropped — by then the server-side exclusion has long since
  // caught up, so there's no need to remember forever.
  const RECENT_SWIPE_WINDOW_MS = 60 * 1000;

  function getRecentSwipes() {
    try {
      const raw = JSON.parse(localStorage.getItem('recentSwipes') || '[]');
      const cutoff = Date.now() - RECENT_SWIPE_WINDOW_MS;
      return raw.filter(entry => entry.ts > cutoff);
    } catch {
      return [];
    }
  }

  function markSwipedLocally(charId) {
    const recent = getRecentSwipes();
    recent.push({ id: charId, ts: Date.now() });
    try {
      localStorage.setItem('recentSwipes', JSON.stringify(recent));
    } catch {}
  }
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verse, setVerse] = useState('all');
  const [showBlockedMsg, setShowBlockedMsg] = useState(false);
  const [permaBanned, setPermaBanned] = useState(false);
  const needsPhotoReupload = !!myCharacter?.profile_pic?.includes('cloudinary.com');
  const [showBlockedSwipeMsg, setShowBlockedSwipeMsg] = useState(false);

  function blockSwipeForPhoto() {
    setShowBlockedSwipeMsg(true);
    setTimeout(() => setShowBlockedSwipeMsg(false), 1800);
  }

  // Final shutdown announcement. Its own localStorage key, so it shows
  // once per device regardless of what anyone dismissed before.
  const [showShutdownPopup, setShowShutdownPopup] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('seenShutdownNotice')) setShowShutdownPopup(true);
  }, []);

  function dismissShutdownPopup() {
    try { localStorage.setItem('seenShutdownNotice', '1'); } catch { }
    setShowShutdownPopup(false);
  }

  useEffect(() => {
    document.body.style.position = 'fixed';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    return () => {
      document.body.style.position = '';
      document.body.style.overflow = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  function loadDeck(verseMode) {
    const savedId = localStorage.getItem('activeCharacterId');
    const params = new URLSearchParams();
    if (savedId) params.set('character_id', savedId);
    if (verseMode === 'marvel_dc') params.set('verse', 'marvel_dc');
    const qs = params.toString();
    setLoading(true);
    fetch(qs ? `/api/swipe?${qs}` : '/api/swipe')
      .then(r => r.json())
      .then(data => {
        const recentlySwipedIds = new Set(getRecentSwipes().map(e => e.id));
        const fresh = (data.characters || []).filter(c => !recentlySwipedIds.has(c.id));
        setCharacters(fresh);
        setCurrent(0);
        setLoading(false);
        setPermaBanned(!!data.marvel_dc_banned);
      });
  }

  function handleVerseTap(mode) {
    if (mode === 'marvel_dc' && !myCharacter?.basics?.marvel_dc) {
      setShowBlockedMsg(true);
      return;
    }
    if (mode === 'all' && myCharacter?.basics?.marvel_dc_only) {
      return;
    }
    setVerse(mode);
    loadDeck(mode);
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetch('/api/characters')
        .then(r => r.json())
        .then(data => {
          if (data.characters.length === 0) {
            router.push('/create-character');
            return;
          }
          const saved = localStorage.getItem('activeCharacterId');
          const active = saved ? data.characters.find(c => c.id == saved) : null;
          const activeChar = active || data.characters[0];
          setMyCharacter(activeChar);
          setAllMyChars(data.characters);

          const initialVerse = activeChar?.basics?.marvel_dc_only ? 'marvel_dc' : 'all';
          setVerse(initialVerse);
          loadDeck(initialVerse);
        });
    }
  }, [status]);

  useEffect(() => { setPhotoIndex(0); }, [current]);

  // Preload next images
  useEffect(() => {
    if (characters[current + 1]?.profile_pic) {
      const img = new Image();
      img.src = characters[current + 1].profile_pic;
    }
    if (characters[current + 2]?.profile_pic) {
      const img2 = new Image();
      img2.src = characters[current + 2].profile_pic;
    }
  }, [current, characters]);

  // Records a swipe with retries. Never awaited by the animation timers above,
  // so a slow or flaky network still can't freeze the deck — but a single
  // dropped request no longer means the like silently vanishes.
  async function recordSwipe(char, direction, attempt = 0) {
    markSwipedLocally(char.id);
    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swiper_character_id: myCharacter.id,
          swiped_character_id: char.id,
          direction: direction === 'right' ? 'right' : 'left',
        }),
      });
      if (!res.ok) throw new Error('swipe request failed: ' + res.status);
      const data = await res.json();
      if (data.matched) { setMatchedChar(char); setMatchedId(data.matchId); setMatched(true); }
    } catch (e) {
      if (attempt < 2) {
        setTimeout(() => recordSwipe(char, direction, attempt + 1), 600 * (attempt + 1));
      } else {
        console.error('swipe failed after retries:', e);
      }
    }
  }

  async function handleSwipe(direction) {
    if (!characters[current] || !myCharacter || swipeDir) return;
    if (needsPhotoReupload) { blockSwipeForPhoto(); return; }
    const char = characters[current];

    // Step 1: flash button
    if (direction === 'right') {
      setHeartFlash(true);
      setTimeout(() => setHeartFlash(false), 200);
    } else {
      setXFlash(true);
      setTimeout(() => setXFlash(false), 200);
    }

    // Step 2: show stamp after button fades (450ms)
    setTimeout(() => {
      setStamp(direction === 'right' ? 'like' : 'nope');
      setStampVisible(true);
    }, 450);

    // Step 3: swipe card after stamp grows + tiny pause (1050ms)
    setTimeout(() => {
      setSwipeDir(direction);
    }, 1050);

    // Step 4: advance to next card. This runs on the timeline no matter what
    // the network does, so a failed or slow request can never freeze the deck.
    setTimeout(() => {
      setCurrent(c => c + 1);
      setSwipeDir(null);
      setStamp(null);
      setStampVisible(false);
      setDragOffset(0);
    }, 1400);

    // Record the swipe. Not awaited, so a slow or dropped request can never
    // freeze the deck — recordSwipe retries internally instead of giving up.
    recordSwipe(char, direction);
  }

  function onTouchStart(e) {
    if (swipeDir || expanded) return;
    dragStart.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  }

  function onTouchMove(e) {
    if (!isDragging || dragStart.current === null) return;
    const offset = e.touches[0].clientX - dragStart.current;
    setDragOffset(offset);
  }

  function onTouchEnd() {
    if (!isDragging) return;
    setIsDragging(false);

    if (needsPhotoReupload && (dragOffset > 80 || dragOffset < -80)) {
      setDragOffset(0);
      blockSwipeForPhoto();
      return;
    }

    if (dragOffset > 80 || dragOffset < -80) {
      const direction = dragOffset > 80 ? 'right' : 'left';
      const char = characters[current];

      setStamp(direction === 'right' ? 'like' : 'nope');
      setStampVisible(true);
      setTimeout(() => setSwipeDir(direction), 200);

      // Advance on a fixed timer, independent of the network response.
      setTimeout(() => {
        setCurrent(c => c + 1);
        setSwipeDir(null);
        setStamp(null);
        setStampVisible(false);
        setDragOffset(0);
      }, 800);

      // Not awaited; recordSwipe retries internally instead of silently giving up.
      recordSwipe(char, direction);
    } else {
      setDragOffset(0);
      setStamp(null);
      setStampVisible(false);
    }
    dragStart.current = null;
  }

  if (status === 'loading' || !myCharacter) return null;

  const char = characters[current];
  const nextChar = characters[current + 1];

  function handlePhotoTap(e) {
    if (!char || swipeDir || Math.abs(dragOffset) > 5) return;
    const photos = getAllPhotos(char);
    if (photos.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) setPhotoIndex(i => Math.max(0, i - 1));
    else setPhotoIndex(i => Math.min(photos.length - 1, i + 1));
  }

  function getAllPhotos(c) {
    const photos = [];
    if (c.profile_pic) photos.push(c.profile_pic);
    if (c.extra_photos?.length > 0) {
      c.extra_photos.forEach(p => { if (p && p !== c.profile_pic) photos.push(p); });
    }
    return photos;
  }

  function renderCard(c) {
    const photos = getAllPhotos(c);
    return photos[0]
      ? <img src={photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(170deg,#2a2a2a,#111)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg,#b71c1c,#e53935)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '800', color: '#fff' }}>{c.name[0]}</div>
      </div>;
  }

  const HeartSVG = () => (
    <svg width={140} height={140} viewBox="0 0 24 24" fill="#fd3b6a" style={{ transform: 'rotate(-20deg)', filter: 'drop-shadow(0 4px 20px rgba(253,59,106,0.8))' }}>
      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
    </svg>
  );

  const XSVG = () => (
    <svg width={140} height={140} viewBox="0 0 24 24" fill="#fff" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.6))' }}>
      <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
    </svg>
  );

  const dragProgress = Math.min(1, Math.abs(dragOffset) / 100);

  const cardTransform = swipeDir === 'right'
    ? 'translateX(160%) rotate(20deg)'
    : swipeDir === 'left'
      ? 'translateX(-160%) rotate(-20deg)'
      : isDragging
        ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.04}deg)`
        : 'translateX(0) rotate(0deg)';

  const heartBtnBg = isDragging && dragOffset > 10
    ? `rgba(${Math.round(40 + dragProgress * 215)},40,40,0.9)`
    : heartFlash ? '#fd3b6a' : 'rgba(40,40,40,0.9)';

  const xBtnBg = isDragging && dragOffset < -10
    ? `rgba(${Math.round(40 + dragProgress * 180)},${Math.round(40 + dragProgress * 180)},${Math.round(40 + dragProgress * 180)},0.9)`
    : xFlash ? 'rgba(220,220,220,0.9)' : 'rgba(40,40,40,0.9)';

  const bottomNav = (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 20px', borderTop: '0.5px solid rgba(255,255,255,0.1)', pointerEvents: 'all' }}>
      {[['ti-flame', 'Swipe', '/swipe', true], ['ti-heart', 'Likes', '/likes', false], ['ti-message-circle', 'Chat', '/chat', false], ['ti-user', 'Profile', '/profile', false]].map(([icon, label, href, active]) => (
        <div key={label} onClick={() => router.push(href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
          <i className={`ti ${icon}`} style={{ fontSize: '24px', color: active ? '#fff' : 'rgba(255,255,255,0.35)' }} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: active ? '#fff' : 'rgba(255,255,255,0.35)' }}>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Nunito,Inter,sans-serif', overflow: 'hidden' }}>

      {expanded && char && (
        <ProfileSheet char={char} onClose={() => setExpanded(false)} onSwipe={(dir) => { setExpanded(false); handleSwipe(dir); }} />
      )}

      {needsPhotoReupload && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 120, background: '#fd3b6a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>
            Your photos need to be re-uploaded to appear in the swipe deck.
          </span>
          <button
            onClick={() => router.push(`/edit-character/${myCharacter.id}`)}
            style={{ background: '#fff', border: 'none', borderRadius: '14px', padding: '5px 14px', color: '#fd3b6a', fontSize: '12px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
          >
            Fix now
          </button>
        </div>
      )}

      {showBlockedSwipeMsg && (
        <div style={{ position: 'fixed', top: '54px', left: '50%', transform: 'translateX(-50%)', zIndex: 121, background: '#1a1a1a', color: '#fff', fontSize: '13px', fontWeight: '700', padding: '10px 20px', borderRadius: '20px', textAlign: 'center', maxWidth: '90%' }}>
          Update your photos before you can swipe
        </div>
      )}

      {showShutdownPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 111, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px 24px', maxWidth: '340px', width: '100%', textAlign: 'center' }}>
            <i className="ti ti-heart" style={{ fontSize: '32px', color: '#fd3b6a', marginBottom: '14px', display: 'block' }} aria-hidden="true" />
            <h1 style={{ color: '#111', fontSize: '19px', fontWeight: '900', margin: '0 0 12px', lineHeight: 1.3 }}>The time has come</h1>
            <p style={{ color: '#333', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
              Match Engine will be going down tonight. Thanks for the fun.
            </p>
            <button
              onClick={dismissShutdownPopup}
              style={{ background: '#fd3b6a', border: 'none', borderRadius: '12px', padding: '13px 40px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {showBlockedMsg && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '0 32px', textAlign: 'center' }}>
          <i className="ti ti-lock" style={{ fontSize: '40px', color: '#fd3b6a' }} />
          <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>You don't have access to this.</h1>
          <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, margin: 0, maxWidth: '300px' }}>
            It's only for Marvel and DC characters. If that's you, toggle it on from the last page of Edit Profile.
          </p>
          <button
            onClick={() => { setShowBlockedMsg(false); setVerse('all'); loadDeck('all'); }}
            style={{ background: '#fd3b6a', border: 'none', borderRadius: '12px', padding: '14px 32px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}
          >
            Back to All
          </button>
        </div>
      )}

      {permaBanned && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '0 32px', textAlign: 'center' }}>
          <i className="ti ti-ban" style={{ fontSize: '40px', color: '#fd3b6a' }} />
          <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>You've permanently lost access to this tab.</h1>
          <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, margin: 0, maxWidth: '300px' }}>
            This was because a character was marked as Marvel or DC incorrectly. Your account itself is not banned.
          </p>
          <button
            onClick={() => { setPermaBanned(false); setVerse('all'); loadDeck('all'); }}
            style={{ background: '#fd3b6a', border: 'none', borderRadius: '12px', padding: '14px 32px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}
          >
            Back to All
          </button>
        </div>
      )}

      {/* Match overlay */}
      {matched && matchedChar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.97)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <p style={{ color: '#fd3b6a', fontSize: '13px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' }}>You Matched!</p>
          <h1 style={{ color: '#111', fontSize: '30px', fontWeight: '800', textAlign: 'center', lineHeight: 1.2, padding: '0 30px' }}>{myCharacter.name} & {matchedChar.name} liked each other</h1>
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fd3b6a', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {myCharacter.profile_pic ? <img src={myCharacter.profile_pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px', fontWeight: '800', color: '#111' }}>{myCharacter.name[0]}</span>}
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
            <button onClick={() => setMatched(false)} style={{ background: 'transparent', border: '1.5px solid #ddd', borderRadius: '12px', padding: '14px', color: '#888', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Keep swiping</button>
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '390px', height: '100%', position: 'relative' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0eeeb' }}>
            <p style={{ color: '#888', fontSize: '16px', fontWeight: '500' }}>Refreshing...</p>
          </div>
        ) : !char ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0eeeb' }}>
            <i className="ti ti-heart-off" style={{ fontSize: '48px', color: '#ddd', marginBottom: '16px' }} />
            {verse === 'marvel_dc' ? (
              <>
                <p style={{ color: '#888', fontSize: '16px', fontWeight: '500', textAlign: 'center', padding: '0 32px' }}>Refresh the feed to view more Marvel & DC profiles!</p>
                <p style={{ color: '#bbb', fontSize: '13px', marginTop: '8px', textAlign: 'center', padding: '0 32px', lineHeight: 1.4 }}>If you refresh once and nothing pops up, wait until more profiles are added to the pool!</p>
              </>
            ) : (
              <p style={{ color: '#888', fontSize: '16px', fontWeight: '500', textAlign: 'center', padding: '0 32px' }}>Refresh the feed to view more profiles!</p>
            )}
            <button
              onClick={() => loadDeck(verse)}
              style={{ marginTop: '18px', background: '#fd3b6a', border: 'none', borderRadius: '10px', padding: '11px 24px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="ti ti-refresh" style={{ fontSize: '15px' }} />
              Refresh
            </button>
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 20px', borderTop: '0.5px solid #eee', background: '#fff' }}>
              {[['ti-flame', 'Swipe', '/swipe', true], ['ti-heart', 'Likes', '/likes', false], ['ti-message-circle', 'Chat', '/chat', false], ['ti-user', 'Profile', '/profile', false]].map(([icon, label, href, active]) => (
                <div key={label} onClick={() => router.push(href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '2px 10px' }}>
                  <i className={`ti ${icon}`} style={{ fontSize: '24px', color: active ? '#fd3b6a' : '#bbb' }} />
                  <span style={{ fontSize: '10px', fontWeight: '600', color: active ? '#fd3b6a' : '#bbb' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : char ? (
          <>
            {/* NEXT card — fully loaded underneath, never moves */}
            {nextChar && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                {renderCard(nextChar)}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.5) 65%, transparent 100%)', paddingTop: '80px', pointerEvents: 'none' }}>
                  <div style={{ padding: '0 16px 12px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>
                      {nextChar.name}{nextChar.age ? <span style={{ fontWeight: '300', color: '#ddd' }}> {nextChar.age}</span> : ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {nextChar.x_handle && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-brand-x" style={{ fontSize: '14px' }} />{nextChar.x_handle}</span>}
                      {nextChar.location && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-map-pin" style={{ fontSize: '14px' }} />{nextChar.location}</span>}
                    </div>
                    {nextChar.bio && <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5, marginTop: '4px' }}>{nextChar.bio}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '12px 0 10px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(40,40,40,0.9)' }} />
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(40,40,40,0.9)' }} />
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(40,40,40,0.9)' }} />
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(40,40,40,0.9)' }} />
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(40,40,40,0.9)' }} />
                  </div>
                  {bottomNav}
                </div>
              </div>
            )}

            {/* CURRENT card */}
            <div
              key={current}
              onClick={handlePhotoTap}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                position: 'absolute', inset: 0, zIndex: 2,
                transition: swipeDir ? 'transform 0.35s ease' : isDragging ? 'none' : 'transform 0.3s ease',
                transform: cardTransform,
                willChange: 'transform',
              }}
            >
              {(() => {
                const photos = getAllPhotos(char);
                const currentPhoto = photos[photoIndex];
                return currentPhoto
                  ? <img src={currentPhoto} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(170deg,#2a2a2a,#111)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg,#b71c1c,#e53935)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '800', color: '#fff' }}>{char.name[0]}</div>
                  </div>;
              })()}

              {/* Heart stamp — drag grows it */}
              {isDragging && dragOffset > 10 && (
                <div style={{ position: 'absolute', top: 30, left: 16, zIndex: 20, transform: `scale(${dragProgress * 0.95})`, opacity: dragProgress, transformOrigin: 'top left' }}>
                  <HeartSVG />
                </div>
              )}
              {/* Heart stamp — button tap, fades+grows in after button fades */}
              {stamp === 'like' && stampVisible && !isDragging && (
                <div style={{ position: 'absolute', top: 30, left: 16, zIndex: 20, animation: 'stampIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards', transformOrigin: 'top left' }}>
                  <HeartSVG />
                </div>
              )}

              {/* X stamp — drag grows it */}
              {isDragging && dragOffset < -10 && (
                <div style={{ position: 'absolute', top: 30, right: 16, zIndex: 20, transform: `scale(${dragProgress * 0.95})`, opacity: dragProgress, transformOrigin: 'top right' }}>
                  <XSVG />
                </div>
              )}
              {/* X stamp — button tap */}
              {stamp === 'nope' && stampVisible && !isDragging && (
                <div style={{ position: 'absolute', top: 30, right: 16, zIndex: 20, animation: 'stampIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards', transformOrigin: 'top right' }}>
                  <XSVG />
                </div>
              )}

              {/* Top nav */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px 60px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'all' }}>
                  <div style={{ width: '22px' }} />
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '3px' }}>
                    {!myCharacter?.basics?.marvel_dc_only && (
                      <div
                        onClick={() => handleVerseTap('all')}
                        style={{ padding: '6px 14px', borderRadius: '16px', background: verse === 'all' ? '#fff' : 'transparent', color: verse === 'all' ? '#111' : '#fff', fontSize: '13px', fontWeight: verse === 'all' ? '700' : '600', cursor: 'pointer' }}
                      >
                        All
                      </div>
                    )}
                    <div
                      onClick={() => handleVerseTap('marvel_dc')}
                      style={{ padding: '6px 14px', borderRadius: '16px', background: verse === 'marvel_dc' ? '#fff' : 'transparent', color: verse === 'marvel_dc' ? '#111' : '#fff', fontSize: '13px', fontWeight: verse === 'marvel_dc' ? '700' : '600', cursor: myCharacter?.basics?.marvel_dc_only ? 'default' : 'pointer' }}
                    >
                      Marvel & DC
                    </div>
                  </div>
                  <div style={{ width: '22px' }} />
                </div>
                {(() => {
                  const photos = getAllPhotos(char);
                  return photos.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '10px' }}>
                      {photos.map((_, i) => (
                        <div key={i} style={{ height: '3px', borderRadius: '2px', width: i === photoIndex ? '22px' : '14px', background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }} />
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Bottom fade + info + buttons */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.5) 65%, transparent 100%)', paddingTop: '80px', pointerEvents: 'none' }}>
                <div style={{ padding: '0 16px 12px', pointerEvents: 'all' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>
                      {char.name}{char.age ? <span style={{ fontWeight: '300', color: '#ddd' }}> {char.age}</span> : ''}
                    </span>
                    <button onClick={() => setExpanded(true)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <i className="ti ti-arrow-big-up" style={{ fontSize: '20px', color: '#fff' }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {char.x_handle && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-brand-x" style={{ fontSize: '14px' }} />{char.x_handle}</span>}
                    {char.location && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-map-pin" style={{ fontSize: '14px' }} />{char.location}</span>}
                  </div>
                  {char.bio && <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>{char.bio}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '12px 0 10px', pointerEvents: 'all' }}>
                  <button onClick={() => handleSwipe('left')} style={{ width: '64px', height: '64px', borderRadius: '50%', background: xBtnBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s', opacity: needsPhotoReupload ? 0.4 : 1 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                      <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
                    </svg>
                  </button>
                  <button onClick={() => handleSwipe('right')} style={{ width: '64px', height: '64px', borderRadius: '50%', background: heartBtnBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s', opacity: needsPhotoReupload ? 0.4 : 1 }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="#fd3b6a">
                      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                    </svg>
                  </button>
                </div>

                {bottomNav}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}