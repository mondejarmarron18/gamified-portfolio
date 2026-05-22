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
  stars: number  // out of 5; max used is 4
}

export interface SkillGroup {
  group: string
  skills: Skill[]
}

export interface ContactInfo {
  email: string
  github: string
  linkedin: string
}

export interface Resume {
  skillGroups: SkillGroup[]
  tools: string[]
  contact: ContactInfo
}
