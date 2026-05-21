import { resume } from '@/data'
import styles from './Modals.module.css'

export function ResumeModal() {
  function downloadCV() {
    const lines = [
      'iForgeTech — Curriculum Vitae',
      'Software Engineer & AI Automation',
      '=====================================',
      '',
      'SKILLS',
      ...resume.skills.map((s) => `${s.name} — ${s.level}`),
      '',
      'TOOLS',
      resume.tools.join(', '),
      '',
      'EDUCATION',
      `${resume.education.degree}, ${resume.education.school} (${resume.education.year})`,
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
      <h2 className={styles.title}>iForgeTech — Résumé</h2>
      <p className={styles.subtitle}>Software Engineer · AI Automation</p>
      <hr className={styles.divider} />
      <div className={styles.body}>
        <section className={styles.resSection}>
          <h3 className={styles.resHead}>Skills</h3>
          {resume.skills.map((s) => (
            <div key={s.name} className={styles.resRow}>
              <span className={styles.resLabel}>{s.name}</span>
              <span className={styles.resVal}>{s.level}</span>
            </div>
          ))}
        </section>
        <section className={styles.resSection}>
          <h3 className={styles.resHead}>Tools &amp; Platforms</h3>
          <div className={styles.tagRow}>
            {resume.tools.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </section>
        <section className={styles.resSection}>
          <h3 className={styles.resHead}>Education</h3>
          <div className={styles.resRow}>
            <span className={styles.resLabel}>{resume.education.degree}</span>
            <span className={styles.resVal}>{resume.education.year}</span>
          </div>
          <div className={styles.resVal}>{resume.education.school}</div>
        </section>
        <div className={styles.btnRow}>
          <button className={styles.btn} onClick={downloadCV}>⬇ Download CV</button>
        </div>
      </div>
    </>
  )
}
