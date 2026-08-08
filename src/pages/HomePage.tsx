import { useEffect, useRef, useState } from 'react'
import CavePage from './CavePage'
import CareTeamPage from './CareTeamPage'
import { TalkToPythia } from "../components/TalkToPythia";
import { PrescriptionUpload } from "../components/PrescriptionUpload";

export default function HomePage() {
  const glowRef = useRef<HTMLDivElement>(null)

  const messages = [
    "Your forest is at peace this morning.",
    "The cedar slept well last night. Can you feel how still everything is?",
    "I've been listening to the birch. Shall we walk together today?",
    "The oak's roots run deep right now. Your thoughts are flowing.",
    "When you're ready to speak, I'm always here by the water.",
    "Stay with the forest for a moment. Just breathe with me.",
    "Everything that matters is still here. The forest holds it all safely."
  ]

  const [msgIndex, setMsgIndex] = useState(0)
  const [showCave, setShowCave] = useState(false)
  const [showCareTeam, setShowCareTeam] = useState(false)
  const [showTalkModal, setShowTalkModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false);
  

  useEffect(() => {
    const el = glowRef.current
    if (!el) return
    let start: number
    const animate = (ts: number) => {
      if (!start) start = ts
      const t = (ts - start) / 1000
      const y = Math.sin(t * 0.8) * 12
      el.style.transform = `translateY(${y}px)`
      requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* FOREST BACKGROUND */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/pythia-forest.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        zIndex: 0
      }} />

      {/* DARK OVERLAY */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)',
        zIndex: 1
      }} />

      {/* PYTHIA GLOW */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          bottom: '38%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          pointerEvents: 'none',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,60,0.4) 0%, rgba(212,168,60,0.1) 50%, transparent 70%)',
          filter: 'blur(8px)'
        }}
      />

      {/* WATER RIPPLE 1 */}
      <div style={{
        position: 'absolute',
        bottom: '35%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        pointerEvents: 'none',
        width: '100px',
        height: '24px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.25)',
        animation: 'ripple1 3s ease-out infinite'
      }} />

      {/* WATER RIPPLE 2 */}
      <div style={{
        position: 'absolute',
        bottom: '35%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        pointerEvents: 'none',
        width: '100px',
        height: '24px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.15)',
        animation: 'ripple1 3s ease-out infinite 1.5s'
      }} />

      {/* KEYFRAMES */}
      <style>{`
        @keyframes ripple1 {
          0%   { transform: translateX(-50%) scale(0.8); opacity: 0.6; }
          100% { transform: translateX(-50%) scale(2.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>

      {/* BOTTOM PANEL */}
      <div style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        width: '100%',
        maxWidth: '420px',
        padding: '0 1.5rem'
      }}>

        {/* LISTENING DOTS */}
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px'
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(212,168,60,0.8)',
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`
            }} />
          ))}
        </div>

        {/* SPEECH BUBBLE */}
        <div
          onClick={() => setShowTalkModal(true)}
          style={{
            cursor: 'pointer',
            background: 'rgba(253,246,236,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212,168,60,0.3)',
            borderRadius: '20px',
            padding: '14px 20px',
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            fontStyle: 'italic',
            lineHeight: 1.65,
            color: '#1a1208',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            position: 'relative',
            width: '100%'
          }}>
          {messages[msgIndex]}
          <div style={{
            position: 'absolute',
            bottom: '-11px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '11px solid rgba(253,246,236,0.92)'
          }} />
        </div>

        {/* THREE PILLS */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          width: '100%'
        }}>

          <button
            onClick={() => setShowTalkModal(true)}
            style={{
              flex: 1,
              background: 'rgba(212,168,60,0.25)',
              border: '1px solid rgba(212,168,60,0.45)',
              borderRadius: '60px',
              padding: '14px 8px',
              color: '#f0d080',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '52px'
            }}>
            🌿 Talk to Pythia
          </button>

          <button
            onClick={() => setShowCave(true)}
            style={{
              flex: 1,
              background: 'rgba(20,40,12,0.55)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '60px',
              padding: '14px 8px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '52px'
            }}>
            🪨 The Cave
          </button>

          <button
            onClick={() => setShowCareTeam(true)}
            style={{
              flex: 1,
              background: 'rgba(20,40,12,0.55)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '60px',
              padding: '14px 8px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '52px'
            }}>
            🏥 Care Team
          </button>

          <div
            onClick={() => setShowUploadModal(true)}
            style={{
              flex: 1,
              background: '#b8962e',
              border: 'none',
              borderRadius: '60px',
              padding: '14px 8px',
              color: '#1a5c6b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '52px'
            }}>
            📋 Upload Prescription
          </div>

        </div>
      </div>

      {showCave && <CavePage onClose={() => setShowCave(false)} />}
      {showCareTeam && <CareTeamPage onClose={() => setShowCareTeam(false)} />}

      {showTalkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <TalkToPythia onClose={() => setShowTalkModal(false)} />
        </div>
      )}

      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <PrescriptionUpload onClose={() => setShowUploadModal(false)} />
        </div>
      )}
    </div>
  )
}