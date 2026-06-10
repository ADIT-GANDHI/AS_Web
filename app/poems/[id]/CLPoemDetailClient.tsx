'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { ChevronLeft, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { CLGlossaryPopup, CLPlayerPopup } from '@/components/Poems/CLPoemPopups';
import GlossaryStrip from '@/components/shared/GlossaryStrip';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';
import {
  findMockPoemById,
  POEMS_GLOSSARY,
  POEMS_RELATED,
  type PoemData,
} from '@/components/Poems/CLPoemMocks';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Poems/CLPoems.css';

type Script = 'devanagari' | 'transliteration' | 'english';

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
    noteText: mock.noteText || '',
    glossary: mock.glossary || '',
    soundCloudUrl: mock.audioUrl || '',
    thumbnailUrl: mock.thumbnailUrl || '',
  };
}

function PoemsLoadingShell() {
  return <Loader />;
}

export default function CLPoemDetailClient({ id }: { id: string }) {
  const [poem, setPoem] = useState<PoemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<Script>('transliteration');
  const [showNotes, setShowNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeRelatedTab, setActiveRelatedTab] = useState<
    'all' | 'songs' | 'poems' | 'reflections' | 'other'
  >('songs');
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);

  useEffect(() => {
    const fetchPoem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/poems?id=${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const item = Array.isArray(data?.data)
          ? data.data.find((row: { id?: string | number }) => String(row.id) === String(id)) ??
            null
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

  const poemText = useMemo(() => {
    if (!poem) return '';
    if (script === 'devanagari' && poem.hindi) return poem.hindi;
    if (script === 'english' && poem.english) return poem.english;
    return poem.text;
  }, [script, poem]);

  const glossaryBody =
    poem?.glossary ||
    POEMS_GLOSSARY.map((g) => `${g.term} — ${g.meaning}`).join('\n\n');

  const counts = related.counts;
  const tabs = [
    { key: 'all' as const, label: 'ALL', count: counts.all },
    { key: 'songs' as const, label: 'SONGS', count: counts.songs },
    { key: 'poems' as const, label: 'POEMS', count: counts.poems },
    { key: 'reflections' as const, label: 'REFLECTIONS', count: counts.reflections },
    { key: 'other' as const, label: 'OTHER', count: counts.other },
  ];

  const visibleItems = useMemo(() => {
    const data = related.data as any;
    if (activeRelatedTab === 'all') {
      return [
        ...(data.songs || []),
        ...(data.poems || []),
        ...(data.reflections || []),
        ...(data.other || []),
      ];
    }
    return data[activeRelatedTab] || [];
  }, [activeRelatedTab, related]);

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
          <Footer />
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

                  {poem.poet && (
                    <div className="clp-poem-poet">
                      poet <span className="name">{poem.poet}</span>
                    </div>
                  )}

                  <div className="clp-halo-controls">
                    <div className="clp-lang-toggle" role="tablist">
                      <button
                        className={`clp-lang-btn${script === 'devanagari' ? ' active' : ''}`}
                        onClick={() => setScript('devanagari')}
                        aria-label="Devanagari"
                      >
                        अ
                      </button>
                      <button
                        className={`clp-lang-btn${script === 'transliteration' ? ' active' : ''}`}
                        onClick={() => setScript('transliteration')}
                        aria-label="Transliteration"
                      >
                        ā
                      </button>
                      <button
                        className={`clp-lang-btn${script === 'english' ? ' active' : ''}`}
                        onClick={() => setScript('english')}
                        aria-label="English"
                      >
                        a
                      </button>
                    </div>

                    {(poem.noteText || poem.glossary) && (
                      <div className="clp-notes-glossary">
                        {poem.noteText && (
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
                        )}
                        {poem.noteText && poem.glossary && (
                          <span className="sep">|</span>
                        )}
                        {poem.glossary && (
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
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <section className="clp-related">
              <h2 className="clp-related-title">Related</h2>
              <div className="clp-related-tabs">
                {tabs.map((t, i) => (
                  <span
                    key={t.key}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}
                  >
                    <button
                      className={`clp-related-tab${activeRelatedTab === t.key ? ' active' : ''}`}
                      onClick={() => setActiveRelatedTab(t.key)}
                    >
                      {t.label}
                      <span className="clp-related-tab-count">({t.count})</span>
                    </button>
                    {i < tabs.length - 1 && (
                      <span className="clp-related-tab-sep">|</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="clp-related-list">
                {visibleItems.length ? (
                  visibleItems.map((item: any) => (
                    <div key={item.id || item.title} className="clp-related-item">
                      <div className="clp-related-thumb">
                        {item.thumbnailUrl && (
                          <img src={item.thumbnailUrl} alt={item.title} />
                        )}
                      </div>
                      <div className="clp-related-body">
                        <div className="clp-related-titlerow">
                          <span className="clp-related-itemtitle">{item.title}</span>
                          {item.subtitle && (
                            <span className="clp-related-itemsubtitle">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        <div className="clp-related-itemdesc">{item.about}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 16, color: '#828282' }}>No related items.</div>
                )}
              </div>
              <a className="clp-related-seemore">SEE MORE</a>
            </section>

            <GlossaryStrip terms={POEMS_GLOSSARY} />
          </div>
        </main>
        <Footer />

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
          {poem.noteText || 'No notes available.'}
        </WavyPaperPopup>

        <CLGlossaryPopup
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
          body={glossaryBody}
          rightAnchor="clamp(160px, 14vw, 300px)"
        />

        <CLPlayerPopup isOpen={showPlayer} onClose={() => setShowPlayer(false)} />
      </div>
    </div>
  );
}
