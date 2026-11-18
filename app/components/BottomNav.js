'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BottomNav({ active }) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const activeId = localStorage.getItem('activeCharacterId');
    fetch(activeId ? `/api/likes?character_id=${activeId}` : '/api/likes')
      .then(r => r.json())
      .then(data => setLikesCount((data.likes || []).length));
  }, []);

  const tabs = [
    { icon: 'ti-flame', label: 'Swipe', href: '/swipe' },
    { icon: 'ti-heart', label: 'Likes', href: '/likes', badge: likesCount },
    { icon: 'ti-message-circle', label: 'Chat', href: '/chat' },
    { icon: 'ti-user', label: 'Profile', href: '/profile' },
  ];

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, display:'flex', justifyContent:'space-around', alignItems:'center', padding:'8px 0 16px', borderTop:'0.5px solid #eee', background:'#fff', zIndex:40 }}>
      {tabs.map(tab => (
        <div key={tab.label} onClick={() => router.push(tab.href)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', cursor:'pointer', position:'relative', padding:'2px 10px' }}>
          <i className={`ti ${tab.icon}`} style={{ fontSize:'24px', color: active === tab.label ? '#fd3b6a' : '#bbb' }} />
          {tab.badge > 0 && (
            <div style={{ position:'absolute', top:'-4px', right:'4px', background:'#fd3b6a', color:'#fff', fontSize:'9px', fontWeight:'700', padding:'1px 5px', borderRadius:'10px', minWidth:'16px', textAlign:'center' }}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </div>
          )}
          <span style={{ fontSize:'10px', fontWeight:'600', color: active === tab.label ? '#fd3b6a' : '#bbb' }}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}