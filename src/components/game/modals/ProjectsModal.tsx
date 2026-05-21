import { projects } from '@/data'
import styles from './Modals.module.css'

export function ProjectsModal() {
  return (
    <>
      <div className={styles.icon}>📦</div>
      <h2 className={styles.title}>Treasure Chest</h2>
      <p className={styles.subtitle}>Portfolio Projects</p>
      <hr className={styles.divider} />
      <div className={styles.projectGrid}>
        {projects.map((p) => (
          <div key={p.name} className={styles.projectCard}>
            <div className={styles.projectGem}>{p.gem}</div>
            <div className={styles.projectName}>{p.name}</div>
            <div className={styles.projectDesc}>{p.desc}</div>
            <div className={styles.tagRow}>
              {p.tags.map((t) => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
            <div className={styles.btnRow}>
              {p.liveUrl && <a className={styles.btn} href={p.liveUrl} target="_blank" rel="noreferrer">Live</a>}
              {p.githubUrl && <a className={`${styles.btn} ${styles.btnSecondary}`} href={p.githubUrl} target="_blank" rel="noreferrer">GitHub</a>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
