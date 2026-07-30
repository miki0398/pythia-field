import { useState, useEffect } from 'react'

const CAVE_STORAGE_KEY = 'pythia_cave_visited'

function isCaveAvailableToday(): boolean {
  const stored = localStorage.getItem(CAVE_STORAGE_KEY)
  if (!stored) return true
  const storedDate = new Date(stored).toDateString()
  const today = new Date().toDateString()
  return storedDate !== today
}

function markCaveVisited() {
  localStorage.setItem(CAVE_STORAGE_KEY, new Date().toISOString())
}

const CAVE_READINGS = [
  { tree: 'The Great Oak', reading: 'The oak is full and deep-rooted. Your thoughts flow clearly today.' },
  { tree: 'The Willow', reading: 'New leaves are opening on the willow. Your calm has been quietly building.' },
  { tree: 'The Silver Birch', reading: 'The birch is thirsty. It asks only for a short walk — even ten minutes brings the rain it needs.' },
  { tree: 'The Old Cedar', reading: 'The cedar stands tall and sure. Your sleep has anchored the whole forest this week.' },
  { tree: 'The Singing Pine', reading: 'The pine sings clearly this morning. Your voice carries more strength than it did last week.' },
  { tree: 'The Maple', reading: 'The maple is steady and generous, as it almost always is. You are living your days well.' },
]

interface CavePageProps {
  onClose: () => void
}

export default function CavePage({ onClose }: CavePageProps) {
  const [phase, setPhase] = useState<'consent' | 'transition' | 'cave' | 'unavailable'>('consent')

  useEffect(() => {
    if (!isCaveAvailableToday()) {
      setPhase('unavailable')
    }
  }, [])

  function enterCave() {
    setPhase('transition')
    setTimeout(() => {
      markCaveVisited()
      setPhase('cave')
    }, 3000)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)'
    }}>

      {/* UNAVAILABLE */}
      {phase === 'unavailable' && (
        <div style={{
          background: 'rgba(10,20,6,0.97)',
          borderRadius: '26px 26px 0 0',
          padding: '32px 24px 48px',
          width: '100%',
          maxWidth: '430px',
          borderTop: '1px solid rgba(212,168,60,0.25)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#d4a83c', marginBottom: '12px' }}>
            Pythia speaks
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: 'rgba(255,248,235,0.9)', lineHeight: 1.6, marginBottom: '24px' }}>
            "The cave is resting until tomorrow, Owen. Ask me anything instead."
          </div>
          <button onClick={onClose} style={{
            width: '100%', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '14px',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px'
          }}>
            Return to the forest
          </button>
        </div>
      )}

      {/* CONSENT */}
      {phase === 'consent' && (
        <div style={{
          background: 'rgba(10,20,6,0.97)',
          borderRadius: '26px 26px 0 0',
          padding: '32px 24px 48px',
          width: '100%',
          maxWidth: '430px',
          borderTop: '1px solid rgba(212,168,60,0.25)'
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#d4a83c', marginBottom: '10px' }}>
            Pythia speaks
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'italic', color: 'rgba(255,248,235,0.9)', lineHeight: 1.6, marginBottom: '8px' }}>
            "Are you sure you'd like to visit the cave today? We can only go once. You can always just ask me instead."
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '24px', lineHeight: 1.5 }}>
            The cave reveals what the forest holds in silence. Once visited, it rests until tomorrow.
          </div>
          <button onClick={enterCave} style={{
            display: 'block', width: '100%',
            background: 'rgba(212,168,60,0.2)',
            border: '1px solid rgba(212,168,60,0.35)',
            borderRadius: '16px', padding: '15px',
            fontFamily: 'Georgia, serif', fontSize: '17px',
            fontStyle: 'italic', color: '#f0d080',
            cursor: 'pointer', marginBottom: '10px'
          }}>
            Take me to the cave
          </button>
          <button onClick={onClose} style={{
            display: 'block', width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '13px',
            fontSize: '13px', color: 'rgba(255,255,255,0.28)',
            cursor: 'pointer'
          }}>
            Stay by the lake today
          </button>
        </div>
      )}

      {/* TRANSITION */}
      {phase === 'transition' && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(6,14,4,0.97)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: '20px', fontStyle: 'italic',
          color: 'rgba(212,168,60,0.8)',
          textAlign: 'center', padding: '40px',
          lineHeight: 1.7,
          animation: 'fadeIn 1s ease'
        }}>
          Pythia rises from the water<br />
          and walks ahead of you<br />
          into the hillside…
        </div>
      )}

      {/* CAVE */}
      {phase === 'cave' && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundImage: 'url(/cave-of-knowing.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(6,3,1,0.97) 35%)',
            padding: '20px 22px 48px',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: '#d4a83c', marginBottom: '8px' }}>
              The Cave of Knowing
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: 'rgba(255,248,230,0.88)', lineHeight: 1.7, marginBottom: '20px' }}>
              "Sit with me. Let me show you what your forest holds…"
            </div>

            {CAVE_READINGS.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(80,200,60,0.2)',
                  boxShadow: '0 0 12px rgba(80,200,60,0.4)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px',
                  flexShrink: 0
                }}>🌿</div>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>
                    {r.tree}
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '13.5px', fontStyle: 'italic', color: 'rgba(255,248,220,0.75)', lineHeight: 1.5 }}>
                    {r.reading}
                  </div>
                </div>
              </div>
            ))}

            <button onClick={onClose} style={{
              display: 'block', width: '100%',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '13px',
              fontSize: '13px', color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', marginTop: '8px'
            }}>
              Return to the forest
            </button>
          </div>
        </div>
      )}

    </div>
  )
}