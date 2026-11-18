'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';

const VIBES = [
  {
    id: 'New to RP',
    title: 'New to RP.',
    sub: 'Just getting started',
    emoji: '🌱',
    bg: 'linear-gradient(135deg,#1a1a2e,#16213e)',
  },
  {
    id: 'Angst & Drama',
    title: 'Angst & Drama.',
    sub: 'Bring the feels',
    emoji: '💔',
    bg: 'linear-gradient(135deg,#2d1b00,#8b4513)',
  },
  {
    id: 'Crack & Chaos',
    title: 'Crack & Chaos.',
    sub: 'Here for a good time, not a long time',
    emoji: '🎭',
    bg: 'linear-gradient(135deg,#0a2a0a,#1a5c2a)',
    wide: true,
  },
];

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  async function handleVibeSelect(vibe) {
    setSelectedVibe(vibe);
    setLoading(true);
    const res = await fetch(`/api/explore?vibe=${encodeURIComponent(vibe)}`);
    const data = await res.json();
    setCharacters(data.characters || []);
    setLoading(false);
  }

  if (status === 'loading') return null;

  return (
    <div style={{ minHeight:'100vh', background:'#f0eeeb', fontFamily:'Inter,sans-serif', paddingBottom:'90px' }}>

      {!selectedVibe ? (
        <>
          <div style={{ padding:'20px 16px 8px' }}>
            <h1 style={{ color:'#111', fontSize:'28px', fontWeight:'800' }}>Explore</h1>
            <p style={{ color:'#aaa', fontSize:'15px', marginTop:'4px' }}>Find your vibe...</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', padding:'8px 16px' }}>
            {VIBES.map(vibe => (
              <div
                key={vibe.id}
                onClick={() => handleVibeSelect(vibe.id)}
                style={{
                  gridColumn: vibe.wide ? 'span 2' : 'span 1',
                  aspectRatio: vibe.wide ? '2' : '0.85',
                  borderRadius:'16px',
                  background: vibe.bg,
                  position:'relative',
                  cursor:'pointer',
                  overflow:'hidden',
                }}
              >
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
                <span style={{ position:'absolute', top:'14px', left:'14px', fontSize:'36px' }}>{vibe.emoji}</span>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 12px' }}>
                  <div style={{ fontSize:'20px', fontWeight:'900', color:'#fff', lineHeight:1.15, marginBottom:'4px' }}>{vibe.title}</div>
                  <div style={{ fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{vibe.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ padding:'20px 16px 8px', display:'flex', alignItems:'center', gap:'12px' }}>
            <button onClick={() => { setSelectedVibe(null); setCharacters([]); }} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
              <i className="ti ti-arrow-left" style={{ fontSize:'24px', color:'#111' }} />
            </button>
            <h1 style={{ color:'#111', fontSize:'22px', fontWeight:'800' }}>{selectedVibe}</h1>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'300px' }}>
              <p style={{ color:'#aaa', fontSize:'15px' }}>Finding characters...</p>
            </div>
          ) : characters.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'300px', flexDirection:'column', gap:'12px' }}>
              <p style={{ color:'#888', fontSize:'16px' }}>No characters with this vibe yet</p>
              <p style={{ color:'#bbb', fontSize:'13px' }}>Be the first to set yours in your profile!</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', padding:'8px 16px' }}>
              {characters.map(char => (
                <div key={char.id} style={{ borderRadius:'16px', overflow:'hidden', background:'#fff', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', cursor:'pointer' }}>
                  <div style={{ width:'100%', aspectRatio:'1', background:'#eee', overflow:'hidden' }}>
                    {char.profile_pic
                      ? <img src={char.profile_pic} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#b71c1c,#e53935)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', fontWeight:'800', color:'#fff' }}>{char.name[0]}</div>
                    }
                  </div>
                  <div style={{ padding:'10px 12px' }}>
                    <p style={{ color:'#111', fontSize:'15px', fontWeight:'700', margin:0 }}>{char.name}{char.age ? `, ${char.age}` : ''}</p>
                    {char.location && <p style={{ color:'#888', fontSize:'12px', margin:'3px 0 0', display:'flex', alignItems:'center', gap:'3px' }}><i className="ti ti-map-pin" style={{ fontSize:'12px' }} />{char.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <BottomNav active="Explore" />
    </div>
  );
}