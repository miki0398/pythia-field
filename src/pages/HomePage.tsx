export default function HomePage() {
  return (
   <div style={{
  position: 'absolute',
  inset: 0,
  backgroundImage: 'url(/pythia-forest.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center 30%',
  zIndex: 0
}} />
  )
      {/* FOREST BACKGROUND IMAGE */}
      <img
        src="/Pythia-forest.jpg"
        alt="Pythia's Living Forest"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          zIndex: 0
        }}
      />

      {/* DARK OVERLAY — makes text readable */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.7) 100%)',
        zIndex: 1
      }} />

      {/* CONTENT */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem'
      }}>

        <div style={{
          border: '1px solid rgba(212,175,55,0.5)',
          borderRadius: '999px',
          padding: '0.35rem 1rem',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: '#D4AF37',
          marginBottom: '1.75rem'
        }}>
          Therapeia
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 300,
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          color: '#F5F0E6',
          textShadow: '0 2px 20px rgba(0,0,0,0.4)'
        }}>
          Pythia Field
        </h1>

        <p style={{
          fontSize: '1.35rem',
          color: '#A7D7B8',
          marginBottom: '1.75rem',
          letterSpacing: '0.04em',
          textShadow: '0 1px 8px rgba(0,0,0,0.5)'
        }}>
          The Living Forest
        </p>

        <p style={{
          fontSize: '1.05rem',
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.82)',
          maxWidth: '480px',
          marginBottom: '2.75rem',
          textShadow: '0 1px 6px rgba(0,0,0,0.5)'
        }}>
          A calm space for monitoring, understanding,
          and gently guiding the mind and brain toward clarity.
        </p>

        <button style={{
          background: 'rgba(255,255,255,0.08)',
          color: '#F5F0E6',
          border: '1px solid rgba(245,240,230,0.4)',
          padding: '0.9rem 2.2rem',
          fontSize: '0.95rem',
          letterSpacing: '0.06em',
          borderRadius: '999px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.25s ease'
        }}>
          Enter the Forest
        </button>

      </div>

      {/* BOTTOM LABEL */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        zIndex: 2,
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.08em'
      }}>
        Patient Zero · Foundation
      </div>
}