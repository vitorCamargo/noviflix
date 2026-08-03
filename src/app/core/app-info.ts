export const APP_INFO = {
  version: '0.1.0',
  author: 'Vitor Camargo',
  authorRole: 'developer',
  authorBio: 'I am a software engineer with a passion for building web applications.',
  links: {
    github: 'https://github.com/vitorcamargo',
    linkedin: 'https://www.linkedin.com/in/vitor-camargo',
  },
} as const;

export interface AboutLink {
  key: keyof typeof APP_INFO.links;
  label: string;
  url: string;
}

export const ABOUT_LINKS: readonly AboutLink[] = [
  { key: 'github', label: 'GitHub', url: APP_INFO.links.github },
  { key: 'linkedin', label: 'LinkedIn', url: APP_INFO.links.linkedin },
];
