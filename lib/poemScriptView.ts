import type { Script } from '@/components/shared/ScriptToggleButtons';

export type PoemScriptFields = {
  text?: string;
  hindi?: string;
  english?: string;
  poet?: string;
  translator?: string;
};

/** Full poem body for the active script — no cross-script fallback. */
export function poemTextForScript(poem: PoemScriptFields, script: Script): string {
  if (script === 'devanagari') return poem.hindi?.trim() || '';
  if (script === 'english') return poem.english?.trim() || '';
  return poem.text?.trim() || '';
}

/** Poet / translator credit only when API content exists for that script view. */
export function poemCreditForScript(
  poem: PoemScriptFields,
  script: Script
): { kind: 'poet' | 'translator'; name: string } | null {
  if (script === 'english') {
    const name = poem.translator?.trim();
    return name && poem.english?.trim() ? { kind: 'translator', name } : null;
  }

  if (script === 'devanagari') {
    const name = poem.poet?.trim();
    return name && poem.hindi?.trim() ? { kind: 'poet', name } : null;
  }

  const name = poem.poet?.trim();
  return name && poem.text?.trim() ? { kind: 'poet', name } : null;
}
