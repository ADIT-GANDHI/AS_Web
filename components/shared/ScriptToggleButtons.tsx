'use client';

import './ScriptToggleButtons.css';

export type Script = 'devanagari' | 'transliteration' | 'english';

type Props = {
  script: Script;
  onChange: (script: Script) => void;
  className?: string;
  /** Scripts with no poem. Grey, not clickable. Omitted scripts stay as they are. */
  disabledScripts?: Partial<Record<Script, boolean>>;
};

/** Shared अ / ā / a script toggle — Songs detail + Poems. */
export default function ScriptToggleButtons({
  script,
  onChange,
  className,
  disabledScripts,
}: Props) {
  const buttons: { id: Script; label: string; glyph: string; latin?: boolean }[] = [
    { id: 'devanagari', label: 'Devanagari', glyph: 'अ' },
    { id: 'transliteration', label: 'Transliteration', glyph: 'ā' },
    { id: 'english', label: 'Latin / English', glyph: 'a', latin: true },
  ];

  return (
    <div
      className={`cld-lang-toggle${className ? ` ${className}` : ''}`}
      role="tablist"
      aria-label="Script"
    >
      {buttons.map((button) => {
        const unavailable = Boolean(disabledScripts?.[button.id]);
        return (
          <button
            key={button.id}
            type="button"
            className={`cld-lang-btn${button.latin ? ' cld-lang-btn--latin' : ''}${script === button.id ? ' active' : ''}`}
            onClick={() => {
              if (!unavailable) onChange(button.id);
            }}
            aria-label={button.label}
            aria-selected={script === button.id}
            aria-disabled={unavailable || undefined}
            disabled={unavailable}
          >
            <span>{button.glyph}</span>
          </button>
        );
      })}
    </div>
  );
}
