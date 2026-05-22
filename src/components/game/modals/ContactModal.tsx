import { resume } from '@/data'
import styles from './Modals.module.css'

const SOCIALS = [
  {
    label: 'GitHub',
    icon: '🐙',
    href: `https://${resume.contact.github}`,
  },
  {
    label: 'LinkedIn',
    icon: '💼',
    href: `https://${resume.contact.linkedin}`,
  },
  {
    label: 'Figma',
    icon: '🎨',
    href: 'https://figma.com/@marron18',
  },
  {
    label: 'Email',
    icon: '📨',
    href: `mailto:${resume.contact.email}`,
  },
]

function DwarfAvatar() {
  return (
    <svg
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.dwarfSvg}
      aria-label="Dwarf avatar"
    >
      {/* Boots */}
      <rect x="28" y="100" width="16" height="14" rx="4" fill="#2a1a0a" />
      <rect x="56" y="100" width="16" height="14" rx="4" fill="#2a1a0a" />
      <rect x="26" y="108" width="20" height="6" rx="3" fill="#1a0e04" />
      <rect x="54" y="108" width="20" height="6" rx="3" fill="#1a0e04" />

      {/* Legs */}
      <rect x="30" y="80" width="14" height="24" rx="4" fill="#3a2510" />
      <rect x="56" y="80" width="14" height="24" rx="4" fill="#3a2510" />

      {/* Belt */}
      <rect x="26" y="77" width="48" height="6" rx="2" fill="#5a3510" />
      <rect x="46" y="77" width="8" height="6" rx="1" fill="#c9903a" />

      {/* Body / Jacket */}
      <rect x="24" y="48" width="52" height="32" rx="7" fill="#1e1e2e" />
      {/* Jacket lapels */}
      <polygon points="50,52 38,48 36,62" fill="#2a2a3e" />
      <polygon points="50,52 62,48 64,62" fill="#2a2a3e" />
      {/* Chest emblem */}
      <circle cx="50" cy="60" r="5" fill="#c9903a" opacity="0.85" />
      <text x="50" y="64" textAnchor="middle" fontSize="6" fill="#1a0e04" fontWeight="bold">✦</text>

      {/* Arms */}
      <rect x="10" y="50" width="14" height="26" rx="6" fill="#1e1e2e" />
      <rect x="76" y="50" width="14" height="26" rx="6" fill="#1e1e2e" />
      {/* Hands */}
      <ellipse cx="17" cy="78" rx="6" ry="5" fill="#c8946a" />
      <ellipse cx="83" cy="78" rx="6" ry="5" fill="#c8946a" />

      {/* Neck */}
      <rect x="44" y="42" width="12" height="10" rx="3" fill="#c8946a" />

      {/* Head */}
      <ellipse cx="50" cy="34" rx="20" ry="18" fill="#c8946a" />

      {/* Helmet */}
      <path d="M30,34 Q30,12 50,10 Q70,12 70,34" fill="#3a3a5e" />
      <rect x="28" y="30" width="44" height="7" rx="3" fill="#4a4a7e" />
      {/* Helmet ridge */}
      <rect x="46" y="10" width="8" height="22" rx="4" fill="#5a5a9e" />
      {/* Helmet rivets */}
      <circle cx="34" cy="32" r="2" fill="#c9903a" />
      <circle cx="66" cy="32" r="2" fill="#c9903a" />

      {/* Eyes */}
      <ellipse cx="43" cy="36" rx="3.5" ry="3" fill="#fff" />
      <ellipse cx="57" cy="36" rx="3.5" ry="3" fill="#fff" />
      <circle cx="44" cy="36" r="2" fill="#3a2510" />
      <circle cx="58" cy="36" r="2" fill="#3a2510" />
      <circle cx="44.8" cy="35.2" r="0.7" fill="#fff" />
      <circle cx="58.8" cy="35.2" r="0.7" fill="#fff" />

      {/* Eyebrows — stern dwarf look */}
      <path d="M40,32 Q43,30 46,32" stroke="#5a3510" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M54,32 Q57,30 60,32" stroke="#5a3510" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx="50" cy="40" rx="3" ry="2.5" fill="#b87850" />

      {/* Beard */}
      <path
        d="M32,44 Q28,52 30,62 Q38,72 50,74 Q62,72 70,62 Q72,52 68,44 Q60,48 50,48 Q40,48 32,44Z"
        fill="#8b5e2a"
      />
      {/* Beard texture lines */}
      <path d="M38,50 Q40,60 42,68" stroke="#c9903a" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M45,50 Q47,62 48,70" stroke="#c9903a" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M53,50 Q53,62 52,70" stroke="#c9903a" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M60,50 Q58,60 56,68" stroke="#c9903a" strokeWidth="1" fill="none" opacity="0.6" />
      {/* Moustache */}
      <path d="M40,44 Q45,47 50,45 Q55,47 60,44" stroke="#6a4010" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function ContactModal() {
  return (
    <>
      <div className={styles.icon}>📜</div>
      <h2 className={styles.title}>Reach Out</h2>
      <p className={styles.subtitle}>Marvin Ronquillo · iForgeTech</p>
      <hr className={styles.divider} />

      <div className={styles.contactProfile}>
        <div className={styles.avatarFrame}>
          <DwarfAvatar />
        </div>

        <p className={styles.contactName}>Marvin Ronquillo</p>
        <p className={styles.contactRole}>Software Engineer · 5+ yrs exp</p>
        <p className={styles.contactLocation}>📍 Nueva Ecija, Philippines</p>

        <hr className={styles.divider} />

        <div className={styles.contactDetails}>
          <a href={`mailto:${resume.contact.email}`} className={styles.contactItem}>
            <span className={styles.contactItemIcon}>📧</span>
            <span>{resume.contact.email}</span>
          </a>
          <a href="tel:+639198603169" className={styles.contactItem}>
            <span className={styles.contactItemIcon}>📞</span>
            <span>+63 919 860 3169</span>
          </a>
          <a href="https://iforgetech.com" target="_blank" rel="noreferrer" className={styles.contactItem}>
            <span className={styles.contactItemIcon}>🌐</span>
            <span>iforgetech.com</span>
          </a>
        </div>

        <div className={styles.socialRow}>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noreferrer"
              className={styles.socialBtn}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
