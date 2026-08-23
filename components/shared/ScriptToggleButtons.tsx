'use client';

import './ScriptToggleButtons.css';

export type Script = 'devanagari' | 'transliteration' | 'english';

type Props = {
  script: Script;
  onChange: (script: Script) => void;
  className?: string;
};

/** Shared अ / ā / a script toggle — Songs detail + Poems. */
export default function ScriptToggleButtons({ script, onChange, className }: Props) {
  return (
    <div
      className={`cld-lang-toggle${className ? ` ${className}` : ''}`}
      role="tablist"
      aria-label="Script"
    >
      <button
        type="button"
        className={`cld-lang-btn${script === 'devanagari' ? ' active' : ''}`}
        onClick={() => onChange('devanagari')}
        aria-label="Devanagari"
        aria-selected={script === 'devanagari'}
      >
        अ
      </button>
      <button
        type="button"
        className={`cld-lang-btn${script === 'transliteration' ? ' active' : ''}`}
        onClick={() => onChange('transliteration')}
        aria-label="Transliteration"
        aria-selected={script === 'transliteration'}
      >
        ā
      </button>
      <button
        type="button"
        className={`cld-lang-btn${script === 'english' ? ' active' : ''}`}
        onClick={() => onChange('english')}
        aria-label="Latin / English"
        aria-selected={script === 'english'}
      >
        a
      </button>
    </div>
  );
}
