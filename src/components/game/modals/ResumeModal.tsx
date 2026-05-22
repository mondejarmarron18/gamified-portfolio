import { resume } from '@/data'
import styles from './Modals.module.css'

function Stars({ count }: { count: number }) {
  return (
    <span className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  )
}

export function ResumeModal() {
  function downloadCV() {
    const lines = [
      'iForgeTech — Curriculum Vitae',
      'Software Engineer & AI Automation',
      '=====================================',
      '',
      'SKILLS',
      ...resume.skillGroups.flatMap((g) => [
        `\n${g.group}`,
        ...g.skills.map((s) => `  ${s.name} — ${'★'.repeat(s.stars)}${'☆'.repeat(5 - s.stars)}`),
      ]),
      '',
      'TOOLS',
      resume.tools.join(', '),
      '',
      'CONTACT',
      ...Object.entries(resume.contact).map(([k, v]) => `${k}: ${v}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'iForgeTech_CV.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className={styles.icon}>📜</div>
      <h2 className={styles.title}>Character Sheet</h2>
      <p className={styles.subtitle}>Skills & Stack</p>
      <hr className={styles.divider} />
      <div className={styles.body}>
        {resume.skillGroups.map((g) => (
          <section key={g.group} className={styles.resSection}>
            <h3 className={styles.resHead}>{g.group}</h3>
            {g.skills.map((s) => (
              <div key={s.name} className={styles.resRow}>
                <span className={styles.resLabel}>{s.name}</span>
                <Stars count={s.stars} />
              </div>
            ))}
          </section>
        ))}
        <section className={styles.resSection}>
          <h3 className={styles.resHead}>Tools &amp; Platforms</h3>
          <div className={styles.tagRow}>
            {resume.tools.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </section>
        <div className={styles.btnRow}>
          <button className={styles.btn} onClick={downloadCV}>⬇ Download CV</button>
        </div>
      </div>
    </>
  )
}
