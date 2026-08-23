'use client';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { ChevronLeft, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { CLGlossaryPopup, CLPlayerPopup } from '@/components/Poems/CLPoemPopups';
import type { AudioVersion } from '@/components/Poems/CLPoemPopups';
import { fetchPoemListen, toAudioVersions } from '@/lib/poemAudio';
import ExploreSection from '@/components/shared/ExploreSection';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';
import ScriptToggleButtons, { type Script } from '@/components/shared/ScriptToggleButtons';
import { poemCreditForScript, poemTextForScript } from '@/lib/poemScriptView';
import {
  findMockPoemById,
  POEMS_RELATED,
  type PoemData,
} from '@/components/Poems/CLPoemMocks';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  relatedGlossaryTerms,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Poems/CLPoems.css';

function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface PoemDetail {
  id: string;
  title: string;
  text: string;
  hindi: string;
  english: string;
  poet: string;
  translator: string;
  noteText: string;
  glossary: string;
  soundCloudUrl: string;
  thumbnailUrl: string;
}

function mapApiItem(it: any): PoemDetail {
  return {
    id: String(it.id || ''),
    title: it.couplet_transliteration || it.original_title || '',
    text:
      htmlToPlainText(it.english_transliteration_text || '') ||
      it.couplet_transliteration ||
      '',
    hindi: htmlToPlainText(it.original_text || ''),
    english:
      htmlToPlainText(it.english_translation_text || '') ||
      String(it.couplet_translation || '').trim(),
    poet: it.attributed_poet || it.poet || '',
    translator: String(it.translator || it.translated_by || it.translation_by || '').trim(),
    noteText: htmlToPlainText(it.note_text || ''),
    glossary: htmlToPlainText(it.glossary || ''),
    soundCloudUrl: it.soundCloud_track_url || '',
    thumbnailUrl: it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '',
  };
}

function mapMockPoem(mock: PoemData): PoemDetail {
  const firstLine = mock.text.split('\n')[0] || mock.text;
  return {
    id: mock.id,
    title: firstLine,
    text: mock.text,
    hindi: mock.hindi || '',
    english: mock.english || '',
    poet: mock.poet || '',
    translator: mock.translator || '',
    noteText: mock.noteText || '',
    glossary: mock.glossary || '',
    soundCloudUrl: mock.audioUrl || '',
    thumbnailUrl: mock.thumbnailUrl || '',
  };
}

function PoemsLoadingShell() {
  return <Loader />;
}

export default function CLPoemDetailClient({ id: idProp }: { id: string }) {
  const pathname = usePathname();
  const urlId = pathname?.split('/').filter(Boolean).pop();
  const id = (urlId && urlId !== '0') ? urlId : idProp;
  const [poem, setPoem] = useState<PoemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<Script>('transliteration');
  const [showNotes, setShowNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);
  const [listenVersions, setListenVersions] = useState<AudioVersion[]>([]);

  useEffect(() => {
    const fetchPoem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/poems?id=${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const raw = data?.data;
        const item = Array.isArray(raw)
          ? raw.find((row: { id?: string | number }) => String(row.id) === String(id)) ?? null
          : raw && typeof raw === 'object'
            ? raw
            : null;
        if (item) {
          setPoem(mapApiItem(item));
          return;
        }
        throw new Error('Empty response');
      } catch {
        const mock = findMockPoemById(id);
        setPoem(mock ? mapMockPoem(mock) : null);
      } finally {
        setLoading(false);
      }
    };
    fetchPoem();
  }, [id]);

  useEffect(() => {
    if (!poem?.id) {
      setRelated(EMPTY_RELATED);
      return;
    }
    let cancelled = false;
    fetchRelatedByParam('poem_id', poem.id).then((result) => {
      if (cancelled) return;
      setRelated(result || asRelatedContent(POEMS_RELATED));
    });
    return () => {
      cancelled = true;
    };
  }, [poem?.id]);

  useEffect(() => {
    if (!poem?.id) {
      setListenVersions([]);
      return;
    }
    let cancelled = false;
    fetchPoemListen(poem.id).then((tracks) => {
      if (cancelled) return;
      setListenVersions(toAudioVersions(tracks));
    });
    return () => {
      cancelled = true;
    };
  }, [poem?.id]);

  const poemText = useMemo(
    () => (poem ? poemTextForScript(poem, script) : ''),
    [script, poem]
  );

  const poemCredit = useMemo(
    () => (poem ? poemCreditForScript(poem, script) : null),
    [script, poem]
  );

  const glossaryTerms = useMemo(() => relatedGlossaryTerms(related), [related]);
  const notesBody =
    (poem?.noteText && poem.noteText.trim()) ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

  if (loading) return <PoemsLoadingShell />;

  if (!poem) {
    return (
      <div className="cl-songs-page-root clp-page-root-wrap">
        <div className="clp-page-root">
          <Header />
          <main className="relative z-10">
            <div
              style={{
                padding: '120px 24px',
                textAlign: 'center',
                fontFamily: 'var(--ajab-font-serif)',
                color: 'var(--ajab-ink-500)',
              }}
            >
              <p>Poem not found.</p>
              <Link
                href="/poems"
                style={{
                  color: 'var(--ajab-pink-primary)',
                  marginTop: 16,
                  display: 'inline-block',
                }}
              >
                ← Back to Poems
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-songs-page-root clp-page-root-wrap">
      <div className="clp-page-root">
        <Header />
        <main className="relative z-10">
          <div className="clp-page clp-page--detail">
            <div className="clp-detail-header">
              <Link href="/poems" className="clp-detail-back">
                <ChevronLeft size={16} strokeWidth={1.5} />
                All Poems
              </Link>
              <div className="clp-count-row">
                <h1 className="clp-count">{poem.title}</h1>
              </div>
            </div>

            <div className="clp-slider-wrap">
              <div className="clp-poem-center">
                <div className="clp-halo-circle">
                  <button
                    className="clp-audio-btn"
                    aria-label="Open audio player"
                    onClick={() => {
                      setShowPlayer(true);
                      setShowGlossary(false);
                      setShowNotes(false);
                    }}
                  >
                    <Volume2 size={24} />
                  </button>

                  <div className="clp-poem-text">{poemText}</div>

                  {poemCredit?.kind === 'poet' && (
                    <div className="clp-poem-poet">
                      poet{' '}
                      <Link
                        href={`/searche?search=${encodeURIComponent(poemCredit.name)}`}
                        className="clp-poem-poet-link name"
                      >
                        {poemCredit.name}
                      </Link>
                    </div>
                  )}
                  {poemCredit?.kind === 'translator' && (
                    <div className="clp-translator">
                      Translation by {poemCredit.name.toUpperCase()}
                    </div>
                  )}

                  <div className="clp-halo-controls">
                    <ScriptToggleButtons script={script} onChange={setScript} />

                    <div className="clp-notes-glossary">
                      <button
                        className={showNotes ? 'is-active' : undefined}
                        onClick={() => {
                          setShowNotes((v) => !v);
                          setShowGlossary(false);
                          setShowPlayer(false);
                        }}
                      >
                        NOTES
                      </button>
                      <span className="sep">|</span>
                      <button
                        className={showGlossary ? 'is-active' : undefined}
                        onClick={() => {
                          setShowGlossary((v) => !v);
                          setShowNotes(false);
                          setShowPlayer(false);
                        }}
                      >
                        GLOSSARY
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ExploreSection data={related.data} className="clp-related" />
          </div>
        </main>
        <WavyPaperPopup
          variant="anchored"
          isOpen={showNotes}
          onClose={() => setShowNotes(false)}
          title="Poem Notes"
          style={{
            right: 'auto',
            left: 'clamp(72px, 8vw, 120px)',
            top: '42%',
            transform: 'translateY(-50%)',
          }}
        >
          {notesBody}
        </WavyPaperPopup>

        <CLGlossaryPopup
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
          terms={glossaryTerms}
          rightAnchor="clamp(160px, 14vw, 300px)"
        />

        <CLPlayerPopup
          isOpen={showPlayer}
          onClose={() => setShowPlayer(false)}
          versions={listenVersions}
        />
      </div>
    </div>
  );
}
