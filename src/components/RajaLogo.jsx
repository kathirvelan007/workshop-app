export default function RajaLogo({ size = 'md', showTagline = true, className = '' }) {
  const pixelSizes = {
    sm: 36,
    md: 48,
    lg: 68,
    xl: 96,
  }

  const dim = pixelSizes[size] || 48

  return (
    <div className={`raja-brand-lockup size-${size} ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="raja-emblem-wrap" style={{ flexShrink: 0 }}>
        <svg
          viewBox="0 0 120 120"
          width={dim}
          height={dim}
          style={{ display: 'block', filter: 'drop-shadow(0 4px 12px rgba(220, 38, 38, 0.35))' }}
        >
          <defs>
            <linearGradient id="rajaRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="rajaGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="rajaDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#232634" />
              <stop offset="100%" stopColor="#0c0d14" />
            </linearGradient>
          </defs>

          {/* Shield Badge */}
          <polygon
            points="60,4 110,24 110,88 60,116 10,88 10,24"
            fill="url(#rajaDark)"
            stroke="url(#rajaRed)"
            strokeWidth="3.5"
          />

          {/* Mechanical Gear Sprocket Accent */}
          <circle
            cx="60"
            cy="56"
            r="40"
            fill="none"
            stroke="url(#rajaRed)"
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />

          {/* Royal Crown on Top */}
          <path
            d="M46,24 L52,34 L60,20 L68,34 L74,24 L76,38 L44,38 Z"
            fill="url(#rajaGold)"
            stroke="#78350f"
            strokeWidth="1"
          />
          <circle cx="46" cy="22" r="2" fill="#fde047" />
          <circle cx="60" cy="18" r="2.5" fill="#fde047" />
          <circle cx="74" cy="22" r="2" fill="#fde047" />

          {/* Motorcycle Silhouette in White */}
          <circle cx="38" cy="65" r="11" fill="none" stroke="#ffffff" strokeWidth="3" />
          <circle cx="38" cy="65" r="4.5" fill="#ef4444" />
          <circle cx="82" cy="65" r="11" fill="none" stroke="#ffffff" strokeWidth="3" />
          <circle cx="82" cy="65" r="4.5" fill="#ef4444" />
          <path
            d="M38,65 L50,53 L64,53 L76,43 L78,45 M64,53 L82,65 M50,53 L56,65 L70,65 M44,50 Q56,43 64,50"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Red RAJA Brand Banner */}
          <rect
            x="20"
            y="76"
            width="80"
            height="18"
            rx="4"
            fill="url(#rajaRed)"
            stroke="url(#rajaGold)"
            strokeWidth="1.5"
          />
          <text
            x="60"
            y="89"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            fontSize="12.5"
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="2.5"
          >
            RAJA
          </text>

          {/* SINCE 1985 Gold Emblem */}
          <text
            x="60"
            y="105"
            fontFamily="system-ui, sans-serif"
            fontWeight="800"
            fontSize="7"
            fill="url(#rajaGold)"
            textAnchor="middle"
            letterSpacing="1.5"
          >
            SINCE 1985
          </text>
        </svg>
      </div>

      {showTagline && (
        <div className="raja-brand-text-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="raja-title-text"
              style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontWeight: 900,
                fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.5rem' : '1.2rem',
                letterSpacing: '0.04em',
                color: '#ffffff',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              RAJA <span style={{ color: '#ef4444' }}>GARAGE</span>
            </span>
            <span
              className="raja-since-pill"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#0f172a',
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              SINCE 1985
            </span>
          </div>
          <div
            className="raja-subtitle-text"
            style={{
              fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '3px',
            }}
          >
            SERVICE • MODIFIED • LATH WORKS
          </div>
        </div>
      )}
    </div>
  )
}
