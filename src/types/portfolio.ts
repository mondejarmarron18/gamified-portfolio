export interface Project {
  gem: string
  name: string
  type: string
  desc: string
  tags: string[]
  liveUrl?: string
  githubUrl?: string
}

export interface ExperienceEntry {
  role: string
  company: string
  date: string
  desc: string
}

export interface Skill {
  name: string
  level: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner'
}

export interface Education {
  degree: string
  school: string
  year: string
}

export interface ContactInfo {
  email: string
  github: string
  linkedin: string
}

export interface Resume {
  skills: Skill[]
  tools: string[]
  education: Education
  contact: ContactInfo
}
