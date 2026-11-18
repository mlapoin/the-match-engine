'use client';
import { useState } from 'react';

export default function ProfileSheet({ char, onClose, onSwipe, onMessage, onRemove, previewMode = false, onBlocked, onDecline, onLike }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState(false);

  async function handleBlock() {
    if (!char || busy) return;
    const ok = window.confirm(
      `Block this account?\n\nYou won't see ${char.name} (or any other character on their account) again, and they won't see you. Any existing matches and messages between you will be deleted.\n\nThis can't be undone from the app.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_character_id: char.id }),
      });
      if (!res.ok) {
        let msg = 'Could not block. Please try again.';
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
        alert(msg);
        setBusy(false);
        return;
      }
      if (onBlocked) onBlocked();
      else if (onClose) onClose();
    } catch {
      alert('Could not block. Please try again.');
    }
    setBusy(false);
  }

  async function handleReport() {
    if (!char || busy || reported) return;
    const reason = window.prompt(
      `Report ${char.name}?\n\nBriefly, what's the problem? (e.g. harassment, spam, underage, other)`
    );
    if (!reason || !reason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_character_id: char.id, reason: reason.trim() }),
      });
      if (!res.ok) {
        let msg = 'Could not submit report. Please try again.';
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
        alert(msg);
        setBusy(false);
        return;
      }
      setReported(true);
      alert("Thanks, this has been sent for review.\n\nIf you'd also like to stop seeing this account entirely, use Block account.");
    } catch {
      alert('Could not submit report. Please try again.');
    }
    setBusy(false);
  }

  async function handleShare() {
    if (!char) return;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/character/${char.id}`
      : '';
    // Some share targets (notably "Copy" inside the native iOS/Android share
    // sheet) only grab the `text` field and silently drop a separate `url`
    // field. Embedding the link directly in the text guarantees it's never
    // lost, whatever the user does with it.
    const shareText = `Check out ${char.name} on Match Engine: ${url}`;
    const shareData = { title: char.name, text: shareText };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!char) return null;

  const lifestyle = char.lifestyle || {};
  const basics = char.basics || {};
  const prompts = char.prompts || [];
  const interests = char.interests || [];

  const card = (children) => (
    <div style={{ background:'#fff', borderRadius:'16px', margin:'10px 12px', padding:'16px' }}>
      {children}
    </div>
  );

  const sectionLabel = (icon, text) => (
    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px' }}>
      <i className={`ti ${icon}`} style={{ fontSize:'15px', color:'#aaa' }} aria-hidden="true" />
      <span style={{ fontSize:'13px', color:'#aaa', fontWeight:'500' }}>{text}</span>
    </div>
  );

  const essRow = (icon, value) => value ? (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom:'0.5px solid #f2f2f2' }}>
      <i className={`ti ${icon}`} style={{ fontSize:'20px', color:'#222', flexShrink:0 }} aria-hidden="true" />
      <span style={{ fontSize:'15px', color:'#111' }}>{value}</span>
    </div>
  ) : null;

  const lifeRow = (label, icon, value) => value ? (
    <div style={{ padding:'8px 0', borderBottom:'0.5px solid #f2f2f2' }}>
      <div style={{ fontSize:'12px', color:'#aaa', fontWeight:'500', marginBottom:'4px' }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <i className={`ti ${icon}`} style={{ fontSize:'18px', color:'#333' }} aria-hidden="true" />
        <span style={{ fontSize:'15px', color:'#111', fontWeight:'500' }}>{value}</span>
      </div>
    </div>
  ) : null;

  const rpTags = basics.rp_tags || [];
  const hasEssentials = char.x_handle || char.location || basics.gender || basics.pronouns || basics.orientation || basics.interested_in || basics.education || basics.job;
  const hasLifestyle = lifestyle.zodiac || lifestyle.drinking || lifestyle.smoking || lifestyle.exercise || lifestyle.pets || lifestyle.love_language || basics.love_style;
  const hasBasics = basics.comm_style;
  const filteredPrompts = prompts.filter(p => p.question && p.answer);

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
      <div style={{ position:'relative', background:'#f2f2f2', borderRadius:'20px 20px 0 0', maxHeight:'92dvh', display:'flex', flexDirection:'column' }}>

        {previewMode && (
          <div style={{ background:'#fd3b6a', color:'#fff', fontSize:'11px', fontWeight:'800', textAlign:'center', padding:'8px', borderRadius:'20px 20px 0 0', letterSpacing:'0.03em', flexShrink:0 }}>
            THIS IS HOW OTHERS SEE YOU
          </div>
        )}

        {/* Sticky header */}
        <div style={{ background:'#fff', padding:'14px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'0.5px solid #e8e8e8', borderRadius: previewMode ? '0' : '20px 20px 0 0', flexShrink:0 }}>
          <div>
            <div style={{ display:'flex', alignItems:'baseline' }}>
              <span style={{ fontSize:'26px', fontWeight:'800', color:'#111' }}>{char.name}</span>
              {char.age && <span style={{ fontSize:'26px', fontWeight:'300', color:'#555', marginLeft:'8px' }}>{char.age}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#111', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <i className="ti ti-arrow-big-down" style={{ fontSize:'20px', color:'#fff' }} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY:'auto', flex:1, minHeight:0 }}>

          {/* Photo */}
          <div style={{ width:'100%', aspectRatio:'1', background:'#c0b8b0', overflow:'hidden', position:'relative' }}>
            {char.profile_pic
              ? <img src={char.profile_pic} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#b71c1c,#e53935)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'64px', fontWeight:'800', color:'#fff' }}>{char.name[0]}</div>
            }
          </div>

          {/* Looking for */}
          {char.looking_for && card(
            <>
              {sectionLabel('ti-search', 'Looking for')}
              <div style={{ fontSize:'20px', fontWeight:'700', color:'#111', marginTop:'2px', marginBottom:'4px' }}>{char.looking_for}</div>
              {rpTags.length > 0 && (
                <div style={{ marginTop:'8px' }}>
                  {rpTags.map(tag => (
                    <span key={tag} style={{ display:'inline-block', background:'#f2f2f2', borderRadius:'20px', padding:'5px 12px', fontSize:'13px', color:'#555', marginTop:'6px', marginRight:'6px' }}>{tag}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* About me */}
          {char.bio && card(
            <>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'10px' }}>
                <i className="ti ti-quote" style={{ fontSize:'15px', color:'#aaa' }} aria-hidden="true" />
                <span style={{ fontSize:'13px', color:'#aaa', fontWeight:'500' }}>About me</span>
              </div>
              <div style={{ fontSize:'15px', color:'#111', lineHeight:1.6 }}>{char.bio}</div>
            </>
          )}

          {/* Quote */}
          {basics.quote && (
            <div style={{ background:'#faf9f7', borderRadius:'16px', margin:'10px 12px', padding:'20px 16px', textAlign:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginBottom:'10px' }}>
                <i className="ti ti-bookmark" style={{ fontSize:'14px', color:'#c9a86a' }} aria-hidden="true" />
                <span style={{ fontSize:'10px', color:'#aaa' }}>Quote that defines me</span>
              </div>
              <div style={{ width:'24px', height:'1px', background:'#ddd', margin:'0 auto 12px' }} />
              <div style={{ fontSize:'14px', color:'#333', lineHeight:1.5 }}>{basics.quote}</div>
            </div>
          )}

          {/* Prompts */}
          {filteredPrompts.map((p, i) => card(
            <div key={i}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'10px' }}>
                <i className="ti ti-quote" style={{ fontSize:'15px', color:'#aaa' }} aria-hidden="true" />
                <span style={{ fontSize:'13px', color:'#aaa', fontWeight:'500' }}>{p.question}</span>
              </div>
              <div style={{ fontSize:'20px', fontWeight:'700', color:'#111', lineHeight:1.3 }}>{p.answer}</div>
            </div>
          ))}

          {/* Section: The Facts */}
          {(hasEssentials || hasLifestyle) && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'18px 22px 4px' }}>
              <span style={{ fontSize:'10px', fontWeight:'800', color:'#bbb', letterSpacing:'0.06em' }}>A CLOSER LOOK</span>
              <div style={{ flex:1, height:'1px', background:'#e0e0e0' }} />
            </div>
          )}

          {/* Essentials */}
          {hasEssentials && card(
            <>
              {sectionLabel('ti-user', 'Essentials')}
              {essRow('ti-brand-x', char.x_handle ? `@${char.x_handle}` : null)}
              {essRow('ti-gender-bigender', basics.gender)}
              {essRow('ti-tag', basics.pronouns)}
              {essRow('ti-rainbow', basics.orientation)}
              {essRow('ti-eye', basics.interested_in ? `Interested in ${basics.interested_in}` : null)}
              {essRow('ti-map-pin', char.location)}
              {essRow('ti-school', basics.education)}
              {essRow('ti-briefcase', basics.job)}
            </>
          )}

          {/* Lifestyle */}
          {hasLifestyle && card(
            <>
              {sectionLabel('ti-leaf', 'Lifestyle')}
              {essRow('ti-moon', lifestyle.zodiac)}
              {essRow('ti-glass', lifestyle.drinking)}
              {essRow('ti-smoking', lifestyle.smoking)}
              {essRow('ti-barbell', lifestyle.exercise)}
              {essRow('ti-paw', lifestyle.pets)}
              {essRow('ti-heart-handshake', lifestyle.love_language || basics.love_style)}
            </>
          )}

          {/* Currently listening to */}
          {(() => {
            const cl = basics.currently_listening;
            const song = cl && typeof cl === 'object' ? cl.song : cl;
            const artist = cl && typeof cl === 'object' ? cl.artist : null;
            if (!song) return null;
            return card(
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <i className="ti ti-headphones" style={{ fontSize:'22px', color:'#fd3b6a', flexShrink:0 }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize:'9px', color:'#bbb', fontWeight:'700', letterSpacing:'0.04em', marginBottom:'2px' }}>NOW PLAYING</div>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#111' }}>{song}{artist ? ` — ${artist}` : ''}</div>
                </div>
              </div>
            );
          })()}

          {/* Basics */}
          {hasBasics && card(
            <>
              {sectionLabel('ti-tag', 'Basics')}
              {lifeRow('Communication style', 'ti-message-circle', basics.comm_style)}
            </>
          )}

          {/* Interests */}
          {interests.length > 0 && card(
            <>
              {sectionLabel('ti-puzzle', 'Interests')}
              <div style={{ marginTop:'6px' }}>
                {interests.map(interest => (
                  <span key={interest} style={{ display:'inline-block', padding:'7px 14px', borderRadius:'20px', border:'1.5px solid #ddd', color:'#333', fontSize:'13px', fontWeight:'500', margin:'4px' }}>{interest}</span>
                ))}
              </div>
            </>
          )}

          {/* Like — only shown when viewing via a shared profile link */}
          {onLike && (
            <div style={{ margin:'10px 12px 0' }}>
              <div style={{ fontSize:'10px', color:'#bbb', margin:'0 0 6px 2px' }}>FROM A SHARED LINK</div>
              <button
                onClick={onLike}
                style={{ width:'100%', background:'#fff', border:'none', borderRadius:'14px', padding:'17px', fontSize:'15px', fontWeight:'700', color:'#fd3b6a', cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}
              >
                <i className="ti ti-heart" style={{ fontSize:'16px' }} aria-hidden="true" />
                Like {char.name}
              </button>
            </div>
          )}

          {/* Share / Remove / Report / Block */}
          <div style={{ margin:'14px 12px 10px', display:'flex', flexDirection:'column', gap:'8px' }}>
            <button onClick={handleShare} style={{ background:'#fff', border:'none', borderRadius:'14px', padding:'17px', fontSize:'15px', fontWeight:'500', color:'#111', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'center' }}>{copied ? 'Link copied!' : `Share ${char.name}`}</button>
            {onRemove && (
              <button onClick={onRemove} style={{ background:'#fff', border:'none', borderRadius:'14px', padding:'17px', fontSize:'15px', fontWeight:'500', color:'#fd3b6a', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'center' }}>Remove {char.name}</button>
            )}
            {onDecline && (
              <button onClick={onDecline} style={{ background:'#fff', border:'none', borderRadius:'14px', padding:'17px', fontSize:'15px', fontWeight:'500', color:'#111', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'center' }}>Decline {char.name}</button>
            )}
            {!previewMode && (
              <>
                <button onClick={handleReport} disabled={busy} style={{ background:'#fff', border:'none', borderRadius:'14px', padding:'17px', fontSize:'15px', fontWeight:'500', color:'#111', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'center', opacity: busy ? 0.6 : 1 }}>
                  {reported ? 'Report submitted' : 'Report'}
                </button>
                <button onClick={handleBlock} disabled={busy} style={{ background:'#fff', border:'none', borderRadius:'14px', padding:'17px', fontSize:'15px', fontWeight:'500', color:'#fd3b6a', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'center', opacity: busy ? 0.6 : 1 }}>
                  Block account
                </button>
              </>
            )}
          </div>
        </div>

        {/* Floating X / star / heart (swipe context) */}
        {onSwipe && (
          <div style={{ flexShrink:0, display:'flex', justifyContent:'center', gap:'16px', padding:'12px 0 calc(24px + env(safe-area-inset-bottom))', background:'rgba(255,255,255,0.98)', borderTop:'0.5px solid #eee' }}>
            <button onClick={() => onSwipe('left')} style={{ width:'58px', height:'58px', borderRadius:'50%', background:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
              <i className="ti ti-x" style={{ fontSize:'24px', color:'#fd3b6a' }} />
            </button>
            <button onClick={() => onSwipe('right')} style={{ width:'58px', height:'58px', borderRadius:'50%', background:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.12)' }}>
              <i className="ti ti-heart" style={{ fontSize:'24px', color:'#fd3b6a' }} />
            </button>
          </div>
        )}

        {/* Message button (new-match context) */}
        {onMessage && (
          <div style={{ flexShrink:0, padding:'12px 16px calc(24px + env(safe-area-inset-bottom))', background:'rgba(255,255,255,0.98)', borderTop:'0.5px solid #eee' }}>
            <button onClick={onMessage} style={{ width:'100%', background:'#fd3b6a', border:'none', borderRadius:'14px', padding:'15px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              <i className="ti ti-message-circle" style={{ fontSize:'18px', color:'#fff' }} aria-hidden="true" />
              Message {char.name.split(' ')[0]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}