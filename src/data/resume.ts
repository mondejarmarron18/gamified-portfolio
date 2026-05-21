import type { Resume } from '@/types/portfolio'

export const resume: Resume = {
  skills: [
    { name: 'JavaScript / TypeScript', level: 'Expert' },
    { name: 'Node.js / Express', level: 'Expert' },
    { name: 'GoHighLevel', level: 'Expert' },
    { name: 'React / HTML / CSS', level: 'Advanced' },
    { name: 'REST API Design', level: 'Advanced' },
    { name: 'Google Apps Script', level: 'Advanced' },
    { name: 'Three.js / WebGL', level: 'Intermediate' },
    { name: 'Python', level: 'Intermediate' },
  ],
  tools: [
    'Claude AI',
    'GoHighLevel',
    'Google Workspace',
    'Twilio / SMS APIs',
    'VS Code',
    'Git / GitHub',
    'Figma',
    'Postman',
  ],
  education: {
    degree: 'BS Information Technology',
    school: 'University of the Philippines',
    year: '2019',
  },
  contact: {
    email: 'hello@iforgetech.com',
    github: 'github.com/iforgetech',
    linkedin: 'linkedin.com/in/iforgetech',
  },
}
