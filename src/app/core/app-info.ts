/** Single place for the strings the About panel surfaces. */
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

/** One outbound link in the About panel. */
export interface AboutLink {
  key: keyof typeof APP_INFO.links;
  label: string;
  url: string;
}

/**
 * Links in display order.
 *
 * Derived from `APP_INFO.links` rather than listed separately, so adding a profile
 * there is all it takes — no second place to keep in step.
 */
export const ABOUT_LINKS: readonly AboutLink[] = [
  { key: 'github', label: 'GitHub', url: APP_INFO.links.github },
  { key: 'linkedin', label: 'LinkedIn', url: APP_INFO.links.linkedin },
];
