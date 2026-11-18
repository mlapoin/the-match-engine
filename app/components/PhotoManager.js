'use client';
import { useState, useEffect } from 'react';

export default function PhotoManager({ characterId, mainPic, onMainPicChange }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (characterId) loadPhotos();
  }, [characterId]);

  async function loadPhotos() {
    const res = await fetch(`/api/photos?character_id=${characterId}`);
    const data = await res.json();
    setPhotos(data.photos || []);
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const total = photos.length + (mainPic ? 1 : 0);
    if (total + files.length > 6) {
      alert('Maximum 6 photos allowed');
      return;
    }

    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character_id: characterId, url: uploadData.url, position: photos.length }),
        });
      }
    }
    await loadPhotos();
    setUploading(false);
  }

  async function handleDelete(photoId) {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photoId }),
    });
    await loadPhotos();
  }

  // Replaces just the main photo. onMainPicChange was already being passed
  // in as a prop, but nothing in this file ever actually called it — the
  // main photo slot had no click handler at all before this.
  async function handleMainPicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        onMainPicChange(uploadData.url);
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  }

  const mainPicBroken = !!mainPic?.includes('cloudinary.com');

  const allPhotos = [
    ...(mainPic ? [{ id: 'main', url: mainPic, isMain: true }] : []),
    ...photos.map(p => ({ ...p, isMain: false })),
  ];

  const slots = Array.from({ length: 6 });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <label style={{ color:'#888', fontSize:'12px', fontWeight:'600' }}>PHOTOS (up to 6)</label>
      {mainPicBroken && (
        <p style={{ color:'#fd3b6a', fontSize:'12px', fontWeight:'700', margin:0 }}>
          Your main photo didn't survive our hosting migration. Tap it below to replace it. NOTE: Do this for all of your images!
        </p>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px' }}>
        {slots.map((_, i) => {
          const photo = allPhotos[i];
          return (
            <div key={i} style={{ aspectRatio:'3/4', borderRadius:'10px', overflow:'hidden', background:'#f0eeeb', border:'1.5px dashed #ddd', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {photo ? (
                <>
                  {photo.isMain ? (
                    <label style={{ width:'100%', height:'100%', display:'block', cursor:'pointer', position:'relative' }}>
                      <img src={photo.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      <div style={{ position:'absolute', top:'4px', right:'4px', width:'22px', height:'22px', borderRadius:'50%', background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                        <i className="ti ti-camera" style={{ fontSize:'12px', color:'#fff' }} />
                      </div>
                      <input type="file" accept="image/*" onChange={handleMainPicChange} style={{ display:'none' }} />
                    </label>
                  ) : (
                    <img src={photo.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  )}
                  {!photo.isMain && (
                    <button
                      onClick={() => handleDelete(photo.id)}
                      style={{ position:'absolute', top:'4px', right:'4px', width:'22px', height:'22px', borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    >
                      <i className="ti ti-x" style={{ fontSize:'12px', color:'#fff' }} />
                    </button>
                  )}
                  {photo.isMain && (
                    <div style={{ position:'absolute', bottom:'4px', left:'4px', background:'rgba(0,0,0,0.5)', borderRadius:'6px', padding:'2px 6px', fontSize:'10px', color:'#fff', fontWeight:'600', pointerEvents:'none' }}>Main</div>
                  )}
                </>
              ) : i === allPhotos.length ? (
                <label style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <i className="ti ti-plus" style={{ fontSize:'24px', color:'#ccc' }} />
                  <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display:'none' }} />
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
      {uploading && <p style={{ color:'#888', fontSize:'13px', textAlign:'center' }}>Uploading...</p>}
    </div>
  );
}