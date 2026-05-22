import type { Resume } from '@/types/portfolio'

export const resume: Resume = {
  skillGroups: [
    {
      group: 'Frontend',
      skills: [
        { name: 'React / Next.js', stars: 4 },
        { name: 'TypeScript / JavaScript', stars: 4 },
        { name: 'Tailwind / ShadCN UI', stars: 4 },
      ],
    },
    {
      group: 'Backend & Runtime',
      skills: [
        { name: 'Node.js / Express / Hono', stars: 4 },
        { name: 'REST API Design', stars: 4 },
        { name: 'BunJS', stars: 3 },
      ],
    },
    {
      group: 'Databases & Infrastructure',
      skills: [
        { name: 'PostgreSQL / MongoDB', stars: 4 },
        { name: 'Redis', stars: 3 },
        { name: 'Docker / AWS / Vercel', stars: 3 },
        { name: 'Cloudflare', stars: 3 },
      ],
    },
    {
      group: 'AI & LLMs',
      skills: [
        { name: 'OpenAI', stars: 4 },
        { name: 'Claude (Anthropic)', stars: 4 },
        { name: 'Gemini', stars: 3 },
        { name: 'LLMs / RAG', stars: 4 },
        { name: 'Vapi.ai', stars: 3 },
      ],
    },
    {
      group: 'Automation & Platforms',
      skills: [
        { name: 'GHL (GoHighLevel)', stars: 3 },
        { name: 'Zapier', stars: 3 },
      ],
    },
  ],
  tools: [
    'React', 'Next.js', 'BunJS', 'TypeScript', 'Node.js', 'Hono',
    'PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Docker',
    'AWS', 'Vercel', 'Cloudflare',
    'OpenAI', 'Claude AI', 'Gemini', 'Vapi.ai',
    'GHL', 'Zapier',
    'Socket.io', 'Figma', 'Git / GitHub', 'Jira',
  ],
  contact: {
    email: 'mondejarmarron18@gmail.com',
    github: 'github.com/mondejarmarron18',
    linkedin: 'linkedin.com/in/marvin-ronquillo-06566a202',
  },
}
