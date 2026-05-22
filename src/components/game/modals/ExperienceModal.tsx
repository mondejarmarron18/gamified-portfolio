import { experience } from '@/data'
import styles from './Modals.module.css'

export function ExperienceModal() {
  return (
    <>
      <div className={styles.icon}>📋</div>
      <h2 className={styles.title}>Quest Log</h2>
      <p className={styles.subtitle}>Work History</p>
      <hr className={styles.divider} />
      <div className={styles.body}>
        {experience.map((e) => (
          <div key={e.company + e.date} className={styles.expItem}>
            <div className={styles.expDot} />
            <div>
              <div className={styles.expRole}>{e.role}</div>
              <div className={styles.expCompany}>{e.company}</div>
              <div className={styles.expDate}>{e.date}</div>
              <div className={styles.expDesc}>{e.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
