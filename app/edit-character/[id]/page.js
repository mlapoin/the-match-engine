'use client';
import { useState, useEffect } from 'react';

async function resizeImage(file, maxDim = 1200, quality = 0.85) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise(resolve => canvas.toBlob(b => resolve(b || file), 'image/jpeg', quality));
  } catch (e) {
    return file;
  }
}
import { useRouter, useParams } from 'next/navigation';
import PhotoManager from '../../components/PhotoManager';

const GENDERS = ['Man', 'Woman', 'Non-binary', 'Other', 'Custom'];
const ORIENTATIONS = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual', 'Demisexual', 'Queer', 'Questioning', 'Prefer not to say'];
const INTERESTED_IN = ['Men', 'Women', 'Beyond the binary', 'Everyone'];

function interestNote(list) {
  if (!list || list.length === 0) return null;
  if (list.includes('Everyone')) {
    return "No restriction — everyone can view your profile, and you'll see everyone too.";
  }
  const labels = list.map(o => o === 'Men' ? 'men' : o === 'Women' ? 'women' : 'those beyond the binary');
  const phrase = labels.length === 1
    ? labels[0]
    : labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];
  const second = labels.length === 1 ? labels[0] : 'them';
  return `Only ${phrase} can view your profile, and you'll only see ${second} too.`;
}
const LOOKING_FOR = ['Long-term ship partner', 'Short-term ship partner', 'A date night', 'One night', 'New friends', 'Open to anything'];
const DRINKING = ['Frequently', 'Socially', 'Occasionally', 'Never', 'Sober', 'Sober curious', 'Prefer not to say'];
const SMOKING = ['Regular', 'Social', 'Never', 'Vaper', 'Prefer not to say'];
const EXERCISE = ['Every day', 'Often', 'Sometimes', 'Rarely', 'Never', 'Prefer not to say'];
const PETS = ['Dog person', 'Cat person', 'Reptile person', 'Bird person', 'Other pet', 'No pets', 'Prefer not to say'];
const ZODIACS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Prefer not to say'];
const LOVE_STYLES = ['Words of affirmation', 'Quality time', 'Physical touch', 'Acts of service', 'Gift giving', 'Prefer not to say'];
const RP_TAGS = ['Angst', 'Drama', 'Crack', 'Novella', 'Fluff', 'Smut', 'Slow burn', 'Action/Adventure', 'Comedy', 'Hurt/Comfort'];
const PROMPTS = [
  'The key to my heart is...', 'The first item on my bucket list is...', 'Two truths and a lie...',
  'My most controversial opinion is...', "I'm known for...", 'My simple pleasures...',
  "I won't shut up about...", "We'll get along if...", 'A fun fact about me...',
  'My love language is...', 'I geek out on...', 'My most irrational fear...',
  'The way to win me over is...', 'My go-to karaoke song is...', "I'm looking for...",
  'My biggest date fail...', "Don't hate me if I...", 'Typical Sunday...',
  'Green flags I look for...', 'If I could have dinner with anyone...', 'Change my mind about...',
  'My red flag is...', "You'll know it's me when...", 'The last thing I lied about...',
  'My comfort ship is...', "I'm weirdly good at...", 'Ask me about...',
  'My toxic trait is...', 'The way to my villain arc is...'
];

const TOTAL_STEPS = 5;

const inputStyle = { background: '#f0eeeb', border: 'none', borderRadius: '10px', padding: '12px 14px', color: '#111', fontSize: '14px', outline: 'none', fontFamily: 'Inter,sans-serif', width: '100%' };
const labelStyle = { color: '#888', fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' };
const requiredLabelStyle = { ...labelStyle, color: '#fd3b6a' };
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const pillStyle = (selected) => ({
  padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: '1.5px solid',
  borderColor: selected ? '#fd3b6a' : '#eee',
  background: selected ? '#fff0f3' : '#fff',
  color: selected ? '#fd3b6a' : '#888',
  fontFamily: 'Inter,sans-serif',
  whiteSpace: 'nowrap',
});

export default function EditCharacterPage() {
  const router = useRouter();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Basics
  const [name, setName] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [marvelDc, setMarvelDc] = useState(false);
  const [marvelDcOnly, setMarvelDcOnly] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [genderCustom, setGenderCustom] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [orientation, setOrientation] = useState('');
  const [interestedIn, setInterestedIn] = useState([]);
  const [interestedInTouched, setInterestedInTouched] = useState(false);
  const [lookingFor, setLookingFor] = useState('');

  // Lifestyle
  const [drinking, setDrinking] = useState('');
  const [smoking, setSmoking] = useState('');
  const [exercise, setExercise] = useState('');
  const [pets, setPets] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [loveLanguage, setLoveLanguage] = useState('');

  // Into
  const [rpTags, setRpTags] = useState([]);
  const [topInterests, setTopInterests] = useState(['', '', '', '', '']);

  // Photos
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentPic, setCurrentPic] = useState(null);

  // About
  const [bio, setBio] = useState('');
  const [quote, setQuote] = useState('');
  const [currentlyListeningSong, setCurrentlyListeningSong] = useState('');
  const [currentlyListeningArtist, setCurrentlyListeningArtist] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState([{ question: '', answer: '' }, { question: '', answer: '' }, { question: '', answer: '' }]);
  const [customQuestionMode, setCustomQuestionMode] = useState([false, false, false]);

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(data => {
        const char = data.characters.find(c => c.id == id);
        if (char) {
          setName(char.name || '');
          setXHandle(char.x_handle || '');
          setAge(char.age || '');
          setBio(char.bio || '');
          setCurrentPic(char.profile_pic || null);
          setLookingFor(char.looking_for || '');
          const loaded = char.interests || [];
          setTopInterests([loaded[0] || '', loaded[1] || '', loaded[2] || '', loaded[3] || '', loaded[4] || '']);
          if (char.prompts && char.prompts.length > 0) {
            const filled = [...char.prompts];
            while (filled.length < 3) filled.push({ question: '', answer: '' });
            const sliced = filled.slice(0, 3);
            setSelectedPrompts(sliced);
            setCustomQuestionMode(sliced.map(p => p.question && !PROMPTS.includes(p.question)));
          }
          if (char.lifestyle) {
            setDrinking(char.lifestyle.drinking || '');
            setSmoking(char.lifestyle.smoking || '');
            setExercise(char.lifestyle.exercise || '');
            setPets(char.lifestyle.pets || '');
            setZodiac(char.lifestyle.zodiac || '');
            setLoveLanguage(char.lifestyle.love_language || '');
          }
          if (char.basics) {
            const savedGender = char.basics.gender || '';
            if (savedGender && !GENDERS.includes(savedGender)) {
              setGender('Custom');
              setGenderCustom(savedGender);
            } else {
              setGender(savedGender);
            }
            setPronouns(char.basics.pronouns || '');
            setQuote(char.basics.quote || '');
            {
              const savedListening = char.basics.currently_listening;
              if (savedListening && typeof savedListening === 'object') {
                setCurrentlyListeningSong(savedListening.song || '');
                setCurrentlyListeningArtist(savedListening.artist || '');
              } else if (savedListening) {
                // Old data was a single free-text string. Keep it visible
                // in the song field rather than losing it.
                setCurrentlyListeningSong(savedListening);
              }
            }
            setOrientation(char.basics.orientation || '');
            {
              const savedInterest = char.basics.interested_in;
              if (Array.isArray(savedInterest)) setInterestedIn(savedInterest);
              else if (savedInterest) setInterestedIn([savedInterest]);
              else setInterestedIn([]);
            }
            if (char.basics.interested_in) setInterestedInTouched(true);
            setRpTags(char.basics.rp_tags || []);
            setMarvelDc(char.basics.marvel_dc === true);
            setMarvelDcOnly(char.basics.marvel_dc_only === true);
            if (!char.lifestyle?.love_language && char.basics.love_style) setLoveLanguage(char.basics.love_style);
          }
        }
      });
  }, [id]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function toggleRpTag(tag) {
    setRpTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function updateTopInterest(index, value) {
    setTopInterests(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function updatePrompt(index, field, value) {
    setSelectedPrompts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleSubmit() {
    if (!name) { setStep(1); return setError('Character name is required'); }
    if (!xHandle.trim()) { setStep(1); return setError('X username @ is required'); }
    if (age && parseInt(age) < 18) { setStep(1); return setError('Must be 18 or older'); }
    setLoading(true);
    setError('');

    try {
      let profile_pic = currentPic;
      if (file) {
        const resized = await resizeImage(file);
        const formData = new FormData();
        formData.append('file', resized, 'photo.jpg');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) { setError('Image upload failed. Try a different photo.'); setLoading(false); return; }
        const uploadData = await uploadRes.json();
        profile_pic = uploadData.url;
      }

      const prompts = selectedPrompts.filter(p => p.question && p.answer);
      const interests = topInterests.map(s => s.trim()).filter(Boolean);

      // "Prefer not to say" is a real, clickable choice in the dropdown —
      // but nothing should be saved for it, so it never shows on the profile.
      const clean = (v) => (v === 'Prefer not to say' ? '' : v);

      const res = await fetch('/api/characters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, name, age: age ? parseInt(age) : null, bio, x_handle: xHandle.trim().replace(/^@/, ''), location: null, profile_pic,
          looking_for: lookingFor, ship_type: null, vibe: rpTags[0] || null, prompts,
          lifestyle: { drinking: clean(drinking), smoking: clean(smoking), exercise: clean(exercise), pets: clean(pets), zodiac: clean(zodiac), love_language: clean(loveLanguage) },
          basics: { gender: gender === 'Custom' ? (genderCustom.trim() || 'Custom') : gender, pronouns: pronouns.trim(), quote: quote.trim(), currently_listening: { song: currentlyListeningSong.trim(), artist: currentlyListeningArtist.trim() }, orientation: clean(orientation), interested_in: interestedIn, rp_tags: rpTags, marvel_dc: marvelDc, marvel_dc_only: marvelDcOnly },
          interests,
        }),
      });

      if (!res.ok) {
        let msg = 'Could not save changes. Please try again.';
        try { const d = await res.json(); if (d && d.error) msg = d.error; } catch (e) { }
        setError(msg);
        setLoading(false);
        return;
      }

      router.push('/profile');
    } catch (err) {
      setError('Something went wrong saving your character. Please try again.');
      setLoading(false);
    }
  }

  const cardStyle = { background: '#fff', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' };
  const fieldWrap = { display: 'flex', flexDirection: 'column', gap: '6px' };

  const backBtn = (to) => (
    <button onClick={() => { setError(''); setStep(to); }} style={{ flex: 1, background: '#f0eeeb', border: 'none', borderRadius: '10px', padding: '13px', color: '#888', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Back</button>
  );
  const nextBtn = (onClick, label = 'Next →') => (
    <button onClick={onClick} style={{ flex: 2, background: '#fd3b6a', border: 'none', borderRadius: '10px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{label}</button>
  );

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f0eeeb', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: 'Inter,sans-serif', padding: '20px' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: (i + 1) <= step ? '#fd3b6a' : '#eee' }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => router.push('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <i className="ti ti-arrow-left" style={{ fontSize: '22px', color: '#111' }} />
              </button>
              <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>Edit character</h1>
            </div>

            <div style={fieldWrap}>
              <label style={requiredLabelStyle}>CHARACTER NAME <span style={{ color: '#fd3b6a' }}>*</span></label>
              <input placeholder="e.g. Jordan Reyes" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={requiredLabelStyle}>X USERNAME @ <span style={{ color: '#fd3b6a' }}>*</span></label>
              <input placeholder="e.g. yourhandle" value={xHandle} onChange={e => setXHandle(e.target.value)} style={inputStyle} />
              <p style={{ color: '#fd3b6a', fontSize: '12px', fontWeight: '600', margin: '6px 0 0' }}>A real X account is required.</p>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>AGE</label>
              <input type="number" placeholder="e.g. 35" value={age} onChange={e => setAge(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>GENDER</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {GENDERS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {gender === 'Custom' && (
                <input
                  type="text"
                  placeholder="Type your own..."
                  value={genderCustom}
                  onChange={e => setGenderCustom(e.target.value)}
                  maxLength={30}
                  style={{ ...inputStyle, marginTop: '8px' }}
                />
              )}
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>PRONOUNS</label>
              <input
                type="text"
                placeholder="e.g. she/her, he/him, they/them..."
                value={pronouns}
                onChange={e => setPronouns(e.target.value)}
                maxLength={30}
                style={inputStyle}
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>SEXUAL ORIENTATION</label>
              <select
                value={orientation}
                onChange={e => {
                  const val = e.target.value;
                  setOrientation(val);
                  if (interestedInTouched) return;
                  const effectiveGender = gender === 'Custom' ? genderCustom : gender;
                  let suggestion = '';
                  if (val === 'Straight') {
                    if (effectiveGender === 'Man') suggestion = 'Women';
                    else if (effectiveGender === 'Woman') suggestion = 'Men';
                  } else if (val === 'Gay') {
                    if (effectiveGender === 'Man') suggestion = 'Men';
                    else if (effectiveGender === 'Woman') suggestion = 'Women';
                  } else if (val === 'Lesbian') {
                    suggestion = 'Women';
                  } else if (['Bisexual', 'Pansexual', 'Queer', 'Questioning'].includes(val)) {
                    suggestion = 'Everyone';
                  }
                  if (suggestion) setInterestedIn([suggestion]);
                }}
                style={selectStyle}
              >
                <option value="">Select...</option>
                {ORIENTATIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>WHO ARE YOU INTERESTED IN SEEING?</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {INTERESTED_IN.map(o => (
                  <button
                    key={o}
                    onClick={() => {
                      setInterestedInTouched(true);
                      setInterestedIn(prev => {
                        if (o === 'Everyone') {
                          return prev.includes('Everyone') ? [] : ['Everyone'];
                        }
                        const withoutEveryone = prev.filter(x => x !== 'Everyone');
                        const next = withoutEveryone.includes(o)
                          ? withoutEveryone.filter(x => x !== o)
                          : [...withoutEveryone, o];
                        const allThree = ['Men', 'Women', 'Beyond the binary'];
                        if (allThree.every(x => next.includes(x))) return ['Everyone'];
                        return next;
                      });
                    }}
                    style={pillStyle(interestedIn.includes(o))}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#fd3b6a', fontWeight: '700', margin: '6px 0 0' }}>Mix and match — select as many as apply.</p>
              {interestNote(interestedIn) && (
                <p style={{ fontSize: '11px', color: '#fd3b6a', margin: '4px 0 0' }}>{interestNote(interestedIn)}</p>
              )}
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>WHAT ARE YOU LOOKING FOR?</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {LOOKING_FOR.map(o => (
                  <button key={o} onClick={() => setLookingFor(o)} style={pillStyle(lookingFor === o)}>{o}</button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: '#fd3b6a', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
            <button onClick={() => { if (!name) return setError('Character name is required'); if (!xHandle.trim()) return setError('X username @ is required'); if (age && parseInt(age) < 18) return setError('Must be 18 or older'); setError(''); setStep(2); }} style={{ background: '#fd3b6a', border: 'none', borderRadius: '10px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>Lifestyle</h1>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '-8px' }}>All optional</p>

            <div style={fieldWrap}>
              <label style={labelStyle}>HOW MUCH DO YOU DRINK?</label>
              <select value={drinking} onChange={e => setDrinking(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {DRINKING.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>HOW MUCH DO YOU SMOKE?</label>
              <select value={smoking} onChange={e => setSmoking(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {SMOKING.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>DO YOU EXERCISE?</label>
              <select value={exercise} onChange={e => setExercise(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {EXERCISE.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>PETS</label>
              <select value={pets} onChange={e => setPets(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {PETS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>ZODIAC</label>
              <select value={zodiac} onChange={e => setZodiac(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {ZODIACS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>WHAT&apos;S YOUR LOVE LANGUAGE?</label>
              <select value={loveLanguage} onChange={e => setLoveLanguage(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {LOVE_STYLES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {backBtn(1)}
              {nextBtn(() => { setError(''); setStep(3); })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>What are you into?</h1>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '-8px' }}>Your RP style and top interests</p>

            <div style={fieldWrap}>
              <label style={labelStyle}>RP TAGS</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {RP_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleRpTag(tag)} style={pillStyle(rpTags.includes(tag))}>{tag}</button>
                ))}
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>NAME UP TO 5 OF YOUR INTERESTS (max 3 words each)</label>
              {topInterests.map((val, i) => (
                <input
                  key={i}
                  placeholder={`Interest ${i + 1}`}
                  value={val}
                  onChange={e => {
                    const words = e.target.value.split(/\s+/).filter(Boolean);
                    if (words.length <= 3) updateTopInterest(i, e.target.value);
                    else updateTopInterest(i, words.slice(0, 3).join(' '));
                  }}
                  style={{ ...inputStyle, marginBottom: '8px' }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {backBtn(2)}
              {nextBtn(() => { setError(''); setStep(4); })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>Your photos</h1>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '-8px' }}>Up to 6. First is your main.</p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div onClick={() => document.getElementById('picInput').click()} style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f0eeeb', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : currentPic ? <img src={currentPic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <i className="ti ti-camera" style={{ fontSize: '28px', color: '#ccc' }} />}
              </div>
              <span style={{ color: '#888', fontSize: '12px' }}>Tap to change main photo</span>
              <input id="picInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {id && (
              <PhotoManager
                characterId={id}
                mainPic={currentPic}
                onMainPicChange={setCurrentPic}
              />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {backBtn(3)}
              {nextBtn(() => { setError(''); setStep(5); })}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>Share more about yourself</h1>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '-8px' }}>Add a bio and pick up to 3 prompts</p>

            <div style={fieldWrap}>
              <label style={labelStyle}>ABOUT ME</label>
              <textarea placeholder="Write in character..." value={bio} onChange={e => setBio(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>A QUOTE THAT DEFINES YOUR CHARACTER</label>
              <input
                type="text"
                placeholder="Your answer..."
                value={quote}
                onChange={e => setQuote(e.target.value)}
                maxLength={150}
                style={inputStyle}
              />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>CURRENTLY LISTENING TO</label>
              <input
                type="text"
                placeholder="Song name"
                value={currentlyListeningSong}
                onChange={e => setCurrentlyListeningSong(e.target.value)}
                maxLength={60}
                style={{ ...inputStyle, marginBottom:'8px' }}
              />
              <input
                type="text"
                placeholder="Artist"
                value={currentlyListeningArtist}
                onChange={e => setCurrentlyListeningArtist(e.target.value)}
                maxLength={60}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={labelStyle}>PROMPTS (pick up to 3)</label>
              {selectedPrompts.map((p, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {customQuestionMode[i] ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Write your own prompt..."
                        value={p.question}
                        onChange={e => updatePrompt(i, 'question', e.target.value)}
                        maxLength={60}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => { setCustomQuestionMode(m => m.map((v, idx) => idx === i ? false : v)); updatePrompt(i, 'question', ''); }}
                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Use preset
                      </button>
                    </div>
                  ) : (
                    <select
                      value={p.question}
                      onChange={e => {
                        if (e.target.value === '__CUSTOM__') {
                          setCustomQuestionMode(m => m.map((v, idx) => idx === i ? true : v));
                          updatePrompt(i, 'question', '');
                        } else {
                          updatePrompt(i, 'question', e.target.value);
                        }
                      }}
                      style={selectStyle}
                    >
                      <option value="">Choose a prompt...</option>
                      {PROMPTS.map(q => <option key={q} value={q}>{q}</option>)}
                      <option value="__CUSTOM__">✏️ Write my own prompt...</option>
                    </select>
                  )}
                  {p.question && (
                    <textarea placeholder="Your answer..." value={p.answer} onChange={e => updatePrompt(i, 'answer', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none' }} />
                  )}
                </div>
              ))}
            </div>

            {error && <p style={{ color: '#fd3b6a', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              {backBtn(4)}
              {nextBtn(() => { setError(''); setStep(6); })}
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h1 style={{ color: '#111', fontSize: '22px', fontWeight: '800', margin: 0 }}>Marvel & DC Verse</h1>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '-8px', lineHeight: 1.5 }}>
              Match Engine has a separate tab for Marvel and DC muses. This is a swipe pool outside of the main deck. Turning this on adds your character to it.
            </p>

            <div style={{ background: '#f7f5f2', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>This is a Marvel or DC character</span>
                <div
                  onClick={() => setMarvelDc(v => { const next = !v; if (!next) setMarvelDcOnly(false); return next; })}
                  style={{ width: '44px', height: '26px', borderRadius: '14px', background: marvelDc ? '#fd3b6a' : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: marvelDc ? '21px' : '3px', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              {marvelDc && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e2dd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>Remove yourself from the All deck</span>
                    <div
                      onClick={() => setMarvelDcOnly(v => !v)}
                      style={{ width: '44px', height: '26px', borderRadius: '14px', background: marvelDcOnly ? '#fd3b6a' : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: marvelDcOnly ? '21px' : '3px', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.5, margin: 0 }}>
                    You'll only appear in the Marvel & DC tab, and will stop receiving likes from accounts outside of it.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fd3b6a', flexShrink: 0 }}>1.</span>
                <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>Your muse MUST be an actual Marvel or DC character.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fd3b6a', flexShrink: 0 }}>2.</span>
                <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>Marvel and DC OCs are allowed.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fd3b6a', flexShrink: 0 }}>3.</span>
                <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>You and your character must both be 18+.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fd3b6a', flexShrink: 0 }}>4.</span>
                <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>Marking a character as Marvel or DC incorrectly will result in an account-wide, permanent loss of access to this tab.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#fd3b6a', flexShrink: 0 }}>5.</span>
                <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>Report any character that breaks these rules! It's the only way the moderator can find out and take action.</span>
              </div>
            </div>

            {error && <p style={{ color: '#fd3b6a', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              {backBtn(5)}
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? '#ccc' : '#fd3b6a', border: 'none', borderRadius: '10px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}