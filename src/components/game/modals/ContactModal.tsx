import { useState } from 'react'
import { resume } from '@/data'
import styles from './Modals.module.css'

export function ContactModal() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    const email = (fd.get('email') as string).trim()
    const msg = (fd.get('message') as string).trim()
    if (!name || !email || !msg) { setStatus('error'); return }
    setStatus('sending')
    setTimeout(() => setStatus('sent'), 1200)
  }

  return (
    <>
      <div className={styles.icon}>📜</div>
      <h2 className={styles.title}>Get In Touch</h2>
      <p className={styles.subtitle}>iForgeTech · Software Engineer &amp; AI Automation</p>
      <hr className={styles.divider} />
      {status === 'sent' ? (
        <p className={styles.successMsg}>✅ Message sent! I'll get back to you soon.</p>
      ) : (
        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.formLabel}>
              Name
              <input name="name" type="text" placeholder="Your name" className={styles.input} />
            </label>
            <label className={styles.formLabel}>
              Email
              <input name="email" type="email" placeholder="your@email.com" className={styles.input} />
            </label>
          </div>
          <label className={styles.formLabel}>
            Subject
            <input name="subject" type="text" placeholder="Project inquiry, collaboration, etc." className={styles.input} />
          </label>
          <label className={styles.formLabel}>
            Message
            <textarea name="message" rows={4} placeholder="Tell me about your project..." className={styles.textarea} />
          </label>
          {status === 'error' && (
            <p className={styles.errorMsg}>Please fill in name, email and message.</p>
          )}
          <div className={styles.btnRow}>
            <button type="submit" className={styles.btn} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : '🔥 Send Message'}
            </button>
          </div>
          <p className={styles.directContact}>
            Or reach out directly:{' '}
            <a href={`mailto:${resume.contact.email}`} className={styles.emailLink}>
              {resume.contact.email}
            </a>
          </p>
        </form>
      )}
    </>
  )
}
