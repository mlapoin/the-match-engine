'use client';

const badgeStyle = { flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#fd3b6a', color: '#fff', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' };
const ruleTextStyle = { fontSize: '13px', color: '#4a4a4a', lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' };

export default function HouseRules({ mode = 'view', onAgree, onDecline, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ background: '#f5f1e8', borderRadius: '18px', width: '100%', maxWidth: '380px', maxHeight: '80dvh', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>

        <div style={{ fontSize: '20px', fontWeight: '900', color: '#1a1a1a', fontFamily: 'Nunito, sans-serif' }}>House rules</div>

        <div style={{ overflowY: 'auto', flex: 1, background: 'rgba(0,0,0,0.03)', borderRadius: '10px', padding: '16px' }}>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>1</div>
            <div style={ruleTextStyle}>{"Match Engine is an "}<b style={{ color: '#1a1a1a' }}>{"in-character 'dating app'"}</b>{" inspired by popular mainstream applications. Please play as your characters\u2014this is not an in-real-life dating app."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>2</div>
            <div style={ruleTextStyle}>{"Match Engine is strictly 18+. This rule applies to both users and RP characters."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>3</div>
            <div style={ruleTextStyle}>{"Play nice. Any variety of disrespectful messaging will result in a permanent ban."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>4</div>
            <div style={ruleTextStyle}>{"AI generated content is not allowed on Match Engine."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>5</div>
            <div style={ruleTextStyle}>{"NSFW content (either written or visual) is NOT allowed on public profiles. However, NSFW content IS allowed in chats, because those are PRIVATE."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>6</div>
            <div style={ruleTextStyle}>{"Strictly lewd / taboo accounts are NOT allowed on Match Engine."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>7</div>
            <div style={ruleTextStyle}>{"Match Engine was created to enhance the roleplay experience on Twitter/X. If you do not have a Twitter/X roleplay account for your character, it will be deleted."}</div>
          </div>

          <div style={{ display: 'flex', gap: '11px', marginBottom: '14px' }}>
            <div style={badgeStyle}>8</div>
            <div style={{ ...ruleTextStyle, color: '#fd3b6a', fontWeight: '700' }}>
              {"Please do your part in keeping Match Engine safe and fun! Report any accounts that are breaking the rules listed above. All it takes is ONE report to get an account reviewed, and banned if necessary."}
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.08)', margin: '16px 0 12px' }} />

          <div style={{ fontSize: '11px', color: '#8a8378', lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>{"This app was built and is maintained by the RP community, for the RP community. If you are experiencing issues, please reach out to the developer."}</div>

        </div>

        {mode === 'agree' ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onDecline} style={{ flex: 1, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '20px', padding: '13px', fontSize: '14px', fontWeight: '700', color: '#666', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
              Decline
            </button>
            <button onClick={onAgree} style={{ flex: 1, background: '#fd3b6a', border: 'none', borderRadius: '20px', padding: '13px', fontSize: '14px', fontWeight: '800', color: '#fff', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
              I agree
            </button>
          </div>
        ) : (
          <button onClick={onClose} style={{ background: '#fd3b6a', border: 'none', borderRadius: '20px', padding: '13px', fontSize: '14px', fontWeight: '800', color: '#fff', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}