export { POEMS_INTRO } from '@/lib/pageIntroTexts';

export const POEMS_FILTER = [
  'ALL',
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),
];
