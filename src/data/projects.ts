import type { Project } from '@/types/portfolio'

export const projects: Project[] = [
  {
    gem: '💎',
    name: 'AI SMS Booking System',
    type: 'Full-Stack · AI Integration',
    desc: 'SMS lead qualification + appointment booking via Claude AI & GoHighLevel CRM.',
    tags: ['Node.js', 'Express', 'Claude AI', 'GoHighLevel', 'SMS'],
    liveUrl: '#',
    githubUrl: '#',
  },
  {
    gem: '🔮',
    name: 'GHL Lovable Integration',
    type: 'Systems Integration',
    desc: 'Polling-based sync engine between GoHighLevel and Lovable using updatedAt timestamps.',
    tags: ['GHL API', 'TypeScript', 'Polling', 'Webhooks'],
    liveUrl: '#',
    githubUrl: '#',
  },
  {
    gem: '🏔️',
    name: 'Roof Inspector Street View',
    type: 'Web Tool',
    desc: 'Single-file HTML tool — shareable property links loading Google Street View directly.',
    tags: ['HTML', 'Google Maps API', 'Street View'],
    liveUrl: '#',
    githubUrl: '#',
  },
  {
    gem: '📞',
    name: 'IVR Call Routing Engine',
    type: 'Telephony',
    desc: 'Overcame GHL ring-cap with IVR Connect Call blocks and Random Split rotation.',
    tags: ['GHL Workflows', 'IVR', 'Telephony', 'Automation'],
    liveUrl: '#',
    githubUrl: '#',
  },
  {
    gem: '📊',
    name: 'Sheets Client Manager',
    type: 'Internal Tools',
    desc: 'Apps Script web app with dynamic dropdowns exposed as a REST API.',
    tags: ['Apps Script', 'REST API', 'Google Sheets'],
    liveUrl: '#',
    githubUrl: '#',
  },
]
