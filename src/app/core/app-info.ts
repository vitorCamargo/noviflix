/** Single place for the strings the About panel surfaces. */
export const APP_INFO = {
  version: '0.1.0',
  author: 'Vitor Camargo',
  authorRole: 'developer',
  authorBio: 'I am a software engineer with a passion for building web applications.',
  links: {
    github: 'https://github.com/vitorCamargo',
  },
} as const;

export interface ResourceTile {
  key: 'code' | 'design';
  title: string;
  subtitle: string;
  url: string;
}
