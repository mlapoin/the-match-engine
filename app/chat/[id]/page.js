'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import ProfileSheet from '../../components/ProfileSheet';

export default function ChatThreadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [myCharacter, setMyCharacter] = useState(null);
  const [content, setContent] = useState('');
  const [otherChar, setOtherChar] = useState(null);
  const [matchDate, setMatchDate] = useState(null);
  const [profileChar, setProfileChar] = useState(null);
  const bottomRef = useRef(null);
  const hasScrolled = useRef(false);
  const isFirstLoad = useRef(true);
  const scrollContainerRef = useRef(null);
  const myCharIdRef = useRef(null);

  useEffect(() => {
    myCharIdRef.current = myCharacter?.id ?? null;
  }, [myCharacter]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetch('/api/characters')
        .then(r => r.json())
        .then(data => {
          if (data.characters.length > 0) {
            const saved = localStorage.getItem('activeCharacterId');
            const active = saved ? data.characters.find(c => c.id == saved) : null;
            setMyCharacter(active || data.characters[0]);
          }
        });
      const activeId = localStorage.getItem('activeCharacterId');
      fetch(activeId ? `/api/matches?character_id=${activeId}` : '/api/matches')
        .then(r => r.json())
        .then(data => {
          const match = (data.matches || []).find(m => m.id == id);
          if (match) {
            const myIds = data.myIds || [];
            if (myIds.includes(match.char1_id)) {
              setOtherChar({ id: match.char2_id, name: match.char2_name, pic: match.char2_pic, handle: match.char2_handle });
            } else {
              setOtherChar({ id: match.char1_id, name: match.char1_name, pic: match.char1_pic, handle: match.char1_handle });
            }
            setMatchDate(new Date(match.created_at));
          }
        });
      markRead();
      loadMessages();
    }
  }, [status]);

  useEffect(() => {
    let interval = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(loadMessages, 5000);
    };
    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadMessages();
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
  }, [id]);

  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      isFirstLoad.current = false;
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        hasScrolled.current = true;
      }, 50);
    }
  }, [messages]);

  async function openProfile() {
    if (!otherChar) return;
    const res = await fetch(`/api/characters/${otherChar.id}`);
    const data = await res.json();
    if (data.character) setProfileChar(data.character);
  }

  async function handleRemove() {
    if (!confirm(`Remove ${otherChar?.name || 'this match'}? This deletes your match and messages.`)) return;
    await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    router.push('/chat');
  }

  async function markRead() {
    try {
      await fetch(`/api/matches/${id}/read`, { method: 'POST' });
    } catch (e) {
      console.error('markRead error:', e);
    }
  }

  async function loadMessages() {
    const res = await fetch(`/api/messages?match_id=${id}`);
    const data = await res.json();
    const newMsgs = data.messages || [];
    const myId = myCharIdRef.current;
    const hasUnread = myId != null && newMsgs.some(m => m.sender_character_id !== myId && !m.read_at);
    if (hasUnread) markRead();
    setMessages(prev => {
      const changed = JSON.stringify(prev) !== JSON.stringify(newMsgs);
      if (changed && hasScrolled.current) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      return newMsgs;
    });
  }

  async function sendMessage() {
    if (!content.trim() || !myCharacter) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: id, sender_character_id: myCharacter.id, content }),
    });
    setContent('');
    loadMessages();
  }

  function formatMatchDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }

  function formatTimestamp(date) {
    const now = new Date();
    const d = new Date(date);
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Today ${time}`;
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
  }

  function groupMessages(msgs) {
    const groups = [];
    let currentGroup = null;
    let lastTime = null;

    msgs.forEach(msg => {
      const msgTime = new Date(msg.created_at);
      const needsTimestamp = !lastTime || (msgTime - lastTime) > 2 * 60 * 60 * 1000;

      if (needsTimestamp) {
        if (currentGroup) groups.push(currentGroup);
        groups.push({ type: 'timestamp', time: msgTime });
        currentGroup = null;
      }

      if (!currentGroup || currentGroup.sender !== msg.sender_character_id) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { type: 'group', sender: msg.sender_character_id, messages: [], time: msgTime };
      }

      currentGroup.messages.push(msg);
      lastTime = msgTime;
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  }

  if (status === 'loading') return null;

  const grouped = groupMessages(messages);
  const isLastMine = messages.length > 0 && myCharacter && messages[messages.length - 1].sender_character_id === myCharacter.id;

  const avatarEl = (size = 28) => (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#b71c1c,#e53935)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${size * 0.4}px`, fontWeight: '800', color: '#fff' }}>
      {otherChar?.pic
        ? <img src={otherChar.pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : otherChar?.name?.[0]
      }
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f0f0f0', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#f0f0f0', padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: '26px', color: '#111' }} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{ position: 'relative', width: '44px', height: '44px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#b71c1c,#e53935)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: '#fff', boxShadow: 'none' }}>
              {otherChar?.pic
                ? <img src={otherChar.pic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : otherChar?.name?.[0]
              }
            </div>
          </div>
          {otherChar && (
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#111', fontFamily: 'Nunito, sans-serif' }}>
              {otherChar.name}
            </span>
          )}
        </div>
        <button onClick={openProfile} aria-label="View profile" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
          <i className="ti ti-arrow-up-right" style={{ fontSize: '24px', color: '#111' }} />
        </button>
      </div>

      {profileChar && <ProfileSheet char={profileChar} onClose={() => setProfileChar(null)} onRemove={handleRemove} />}

      {/* Messages */}
      <div ref={scrollContainerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '80px 14px 80px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>

          {/* Match banner */}
          <div style={{ textAlign: 'center', padding: '24px 20px 8px', fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}>
            {otherChar && `You matched with ${otherChar.name} on ${formatMatchDate(matchDate)}`}
          </div>

          {grouped.map((item, gi) => {
            if (item.type === 'timestamp') {
              return (
                <div key={gi} style={{ textAlign: 'center', fontSize: '12px', color: '#aaa', padding: '12px 0 8px', fontFamily: 'Nunito, sans-serif' }}>
                  {formatTimestamp(item.time)}
                </div>
              );
            }

            const isMine = myCharacter && item.sender === myCharacter.id;
            return (
              <div key={gi} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: '8px', paddingLeft: isMine ? 0 : '36px', position: 'relative' }}>
                {!isMine && (
                  <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
                    {avatarEl(28)}
                  </div>
                )}
                {item.messages.map((msg, mi) => {
                  const isFirst = mi === 0;
                  const isLast = mi === item.messages.length - 1;
                  let borderRadius;
                  if (isMine) {
                    if (item.messages.length === 1) borderRadius = '22px 22px 4px 22px';
                    else if (isFirst) borderRadius = '22px 22px 4px 22px';
                    else if (isLast) borderRadius = '22px 22px 4px 22px';
                    else borderRadius = '22px 4px 4px 22px';
                  } else {
                    if (item.messages.length === 1) borderRadius = '22px 22px 22px 4px';
                    else if (isFirst) borderRadius = '22px 22px 22px 4px';
                    else if (isLast) borderRadius = '22px 22px 22px 4px';
                    else borderRadius = '4px 22px 22px 4px';
                  }
                  return (
                    <div key={msg.id} style={{ padding: '10px 16px', fontSize: '16px', lineHeight: 1.45, maxWidth: '75%', marginBottom: '2px', borderRadius, background: isMine ? '#2d0a0a' : '#e8e8e8', color: isMine ? '#fff' : '#111', fontFamily: 'Nunito, sans-serif' }}>
                      {msg.content}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {isLastMine && <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'right', padding: '2px 4px 4px', fontFamily: 'Nunito, sans-serif' }}>Sent</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ background: '#f0f0f0', padding: '8px 14px 24px', display: 'flex', alignItems: 'center', gap: '10px', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message"
          style={{ flex: 1, background: '#fff', border: 'none', borderRadius: '24px', padding: '12px 18px', fontSize: '16px', color: '#111', outline: 'none', fontFamily: 'Nunito, sans-serif' }}
        />
        {content.trim() && (
          <button onClick={sendMessage} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fd3b6a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-send" style={{ fontSize: '18px', color: '#fff' }} />
          </button>
        )}
      </div>
    </div>
  );
}