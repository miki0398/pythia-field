import { useState } from 'react'

interface CareTeamPageProps {
  onClose: () => void
}

export default function CareTeamPage({ onClose }: CareTeamPageProps) {
  const [activeTab, setActiveTab] = useState<'medical' | 'emergency' | 'navigator'>('medical')
  const [path, setPath] = useState<'none' | 'pythia' | 'manual'>('none')

  // Emergency form state
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [relationship, setRelationship] = useState('')
  const [sensitive, setSensitive] = useState(false)
  const [saved, setSaved] = useState(false)

  function saveEmergency() {
    if (!emergencyName || !emergencyPhone) return
    localStorage.setItem('pythia_emergency_contact', JSON.stringify({
      name: emergencyName,
      phone: emergencyPhone,
      relationship,
      sensitive,
      savedAt: new Date().toISOString()
    }))
    setSaved(true)
  }

  const tabStyle = (tab: string) => ({
    flex: 1,
    background: activeTab === tab ? 'rgba(212,168,60,0.18)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${activeTab === tab ? 'rgba(212,168,60,0.35)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '10px',
    padding: '10px 8px',
    fontSize: '11px',
    fontWeight: 500,
    color: activeTab === tab ? '#f0d080' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    textAlign: 'center' as const
  })

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '13px 14px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    outline: 'none',
    marginBottom: '10px',
    fontFamily: 'system-ui, sans-serif'
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(10,22,8,0.92)',
      backdropFilter: 'blur(24px)'
    }}>

      {/* HEADER */}
      <div style={{
        padding: '16px 20px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          width: '36px', height: '36px',
          color: 'white', cursor: 'pointer',
          fontSize: '16px', flexShrink: 0
        }}>←</button>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 500, color: 'rgba(255,255,255,0.95)' }}>
            My Care Circle
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            Medical team · Emergency · Navigator
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          <button style={tabStyle('medical')} onClick={() => setActiveTab('medical')}>Medical Team</button>
          <button style={tabStyle('emergency')} onClick={() => setActiveTab('emergency')}>Emergency</button>
          <button style={tabStyle('navigator')} onClick={() => setActiveTab('navigator')}>Navigator</button>
        </div>

        {/* MEDICAL TAB */}
        {activeTab === 'medical' && (
          <div>
            {path === 'none' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div onClick={() => setPath('pythia')} style={{
                  flex: 1, background: 'rgba(212,168,60,0.12)',
                  border: '1px solid rgba(212,168,60,0.25)',
                  borderRadius: '12px', padding: '14px 10px',
                  cursor: 'pointer', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>🌿</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Let Pythia ask</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>She'll ask in conversation over the next few days</div>
                </div>
                <div onClick={() => setPath('manual')} style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '14px 10px',
                  cursor: 'pointer', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>✍️</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Fill it myself</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>Enter your providers directly</div>
                </div>
              </div>
            )}

            {path === 'pythia' && (
              <div style={{
                background: 'rgba(212,168,60,0.08)',
                border: '1px solid rgba(212,168,60,0.2)',
                borderRadius: '14px', padding: '14px 16px'
              }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4a83c', marginBottom: '6px' }}>Pythia will ask</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: 'rgba(255,248,220,0.85)', lineHeight: 1.6, marginBottom: '10px' }}>
                  "I'd love to get to know your care team. I'll ask you gently over the next few days."
                </div>
                <button onClick={() => setPath('none')} style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '10px', width: '100%',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px'
                }}>Go back</button>
              </div>
            )}

            {path === 'manual' && (
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Primary Physician</div>
                <input style={inputStyle} placeholder="Doctor's full name" />
                <input style={inputStyle} placeholder="Specialty or role" />
                <input style={inputStyle} placeholder="Phone number" />
                <input style={inputStyle} placeholder="Hospital or practice name" />
                <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', marginTop: '4px' }}>Pharmacy</div>
                <input style={inputStyle} placeholder="Pharmacy name and phone" />
                <button style={{
                  display: 'block', width: '100%',
                  background: 'linear-gradient(135deg, rgba(60,100,25,0.8), rgba(80,140,35,0.6))',
                  border: '1px solid rgba(100,180,50,0.3)',
                  borderRadius: '16px', padding: '16px',
                  fontFamily: 'Georgia, serif', fontSize: '17px',
                  fontStyle: 'italic', color: 'rgba(200,240,140,0.9)',
                  cursor: 'pointer', marginTop: '8px'
                }}>
                  Save my care team
                </button>
              </div>
            )}
          </div>
        )}

        {/* EMERGENCY TAB */}
        {activeTab === 'emergency' && (
          <div>
            {saved ? (
              <div style={{
                background: 'rgba(80,200,80,0.1)',
                border: '1px solid rgba(80,200,80,0.2)',
                borderRadius: '12px', padding: '14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '14px'
              }}>
                <span style={{ fontSize: '22px' }}>🟢</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Emergency contact saved</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>A confirmation will be sent to them</div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(200,80,60,0.12)',
                border: '1px solid rgba(200,80,60,0.2)',
                borderRadius: '12px', padding: '14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '14px'
              }}>
                <span style={{ fontSize: '22px' }}>🔴</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>No emergency contact set</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Add someone Pythia can reach</div>
                </div>
              </div>
            )}

            <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Contact's Full Name</div>
            <input style={inputStyle} placeholder="e.g. Maria Jerez" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} />

            <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Relationship</div>
            <select
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="">Select relationship…</option>
              <option>Spouse / Partner</option>
              <option>Child</option>
              <option>Parent</option>
              <option>Sibling</option>
              <option>Close Friend</option>
              <option>Caregiver</option>
            </select>

            <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Mobile Phone</div>
            <input style={inputStyle} placeholder="+1 (555) 000-0000" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} />

            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Be sensitive in messages</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Pythia will use gentle wording</div>
              </div>
              <div
                onClick={() => setSensitive(s => !s)}
                style={{
                  width: '44px', height: '26px',
                  background: sensitive ? 'rgba(212,168,60,0.7)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '13px', cursor: 'pointer',
                  position: 'relative', transition: 'background 0.3s'
                }}>
                <div style={{
                  position: 'absolute',
                  width: '20px', height: '20px',
                  background: 'white', borderRadius: '50%',
                  top: '3px', left: sensitive ? '21px' : '3px',
                  transition: 'left 0.3s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>

            <button onClick={saveEmergency} style={{
              display: 'block', width: '100%',
              background: 'linear-gradient(135deg, rgba(60,100,25,0.8), rgba(80,140,35,0.6))',
              border: '1px solid rgba(100,180,50,0.3)',
              borderRadius: '16px', padding: '16px',
              fontFamily: 'Georgia, serif', fontSize: '17px',
              fontStyle: 'italic', color: 'rgba(200,240,140,0.9)',
              cursor: 'pointer'
            }}>
              Save emergency contact
            </button>
          </div>
        )}

        {/* NAVIGATOR TAB */}
        {activeTab === 'navigator' && (
          <div>
            <div style={{
              background: 'rgba(60,120,200,0.1)',
              border: '1px solid rgba(60,120,200,0.2)',
              borderRadius: '14px', padding: '14px 16px',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(140,180,255,0.8)', marginBottom: '6px' }}>
                Pythia Navigator Connection
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c2a040' }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Pending setup</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Your care team has not yet activated Pythia Navigator. Once connected, your doctor can see your forest's signals — with your permission.
              </div>
              <button style={{
                display: 'block', width: '100%',
                background: 'rgba(60,120,200,0.2)',
                border: '1px solid rgba(60,120,200,0.3)',
                borderRadius: '10px', padding: '11px',
                fontSize: '13px', fontWeight: 600,
                color: 'rgba(140,180,255,0.9)',
                cursor: 'pointer', marginTop: '10px'
              }}>
                Request Navigator activation
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
              Your doctor sees anonymized NFB trend data and deviation signals. <strong style={{ color: 'rgba(255,255,255,0.6)' }}>They never see your conversations with Pythia.</strong> Each sharing session requires your fingerprint.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}