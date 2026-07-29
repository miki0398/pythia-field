export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
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

      {/* BOTTOM PANEL */}
      <div style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        width: '100%',
        maxWidth: '420px',
        padding: '0 1.5rem'
      }}>

        {/* SPEECH BUBBLE */}
        <div style={{
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
          position: 'relative'
        }}>
          Your forest is at peace this morning.
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
          width: '100%',
          justifyContent: 'center'
        }}>

          <button style={{
            flex: 1.4,
            background: 'rgba(212,168,60,0.25)',
            border: '1px solid rgba(212,168,60,0.45)',
            borderRadius: '60px',
            padding: '12px 16px',
            color: '#f0d080',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            🌿 Talk to Pythia
          </button>

          <button style={{
            flex: 1,
            background: 'rgba(20,40,12,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '60px',
            padding: '12px 16px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            🪨 The Cave
          </button>

          <button style={{
            flex: 1,
            background: 'rgba(20,40,12,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '60px',
            padding: '12px 16px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            🏥 Care Team
          </button>

        </div>
      </div>

    </div>
  )
}