'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  buildExploreEntries,
  getExploreItemDescription,
  getExploreItemSubtitle,
  getExploreItemTitle,
  getExploreKeywords,
  type ExploreListEntry,
} from '@/lib/exploreRelated';
import { getRelatedDetailHref } from '@/lib/relatedDetailHref';
import { resolveCmsAssetUrl, withAppBasePath } from '@/lib/resolveCmsAssetUrl';
import { truncateAtWord } from '@/lib/truncateAtWord';
import './ExploreSection.css';

const EXPLORE_INITIAL_COUNT = 3;

type ExploreSectionProps = {
  /** Related API `data` object (raw or normalized). */
  data: Record<string, unknown> | null | undefined;
  className?: string;
  /** Number of rows shown before the See More control. */
  initialCount?: number;
  /**
   * Clamp descriptions to N lines with a trailing ellipsis and drop the
   * read-more toggle (Poems design). Omit to keep the "…more" behaviour.
   */
  descriptionLines?: number;
};

function entryKey(entry: ExploreListEntry, index: number): string {
  const id =
    entry.item?.id != null && entry.item?.id !== ''
      ? String(entry.item.id)
      : 'noid';
  return `${entry.bucket}-${id}-${index}`;
}

export default function ExploreSection({
  data,
  className = '',
  initialCount = EXPLORE_INITIAL_COUNT,
  descriptionLines,
}: ExploreSectionProps) {
  const clampLines = descriptionLines && descriptionLines > 0 ? descriptionLines : 0;
  const keywords = useMemo(() => getExploreKeywords(data), [data]);
  const [activeKeywordId, setActiveKeywordId] = useState<'all' | string>('all');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [listExpanded, setListExpanded] = useState(false);

  useEffect(() => {
    setActiveKeywordId('all');
    setExpandedRows({});
    setListExpanded(false);
  }, [data]);

  useEffect(() => {
    setListExpanded(false);
    setExpandedRows({});
  }, [activeKeywordId]);

  const entries = useMemo(
    () => buildExploreEntries(data, activeKeywordId),
    [data, activeKeywordId]
  );

  const displayed = useMemo(() => {
    if (listExpanded || entries.length <= initialCount) return entries;
    return entries.slice(0, initialCount);
  }, [entries, initialCount, listExpanded]);

  const hasMore = entries.length > initialCount;

  const allEntries = useMemo(() => buildExploreEntries(data, 'all'), [data]);
  if (!keywords.length && !allEntries.length) return null;

  return (
    <section className={`explore-section ${className}`.trim()}>
      <h2 className="explore-title">Explore</h2>

      <div className="explore-themes" role="tablist" aria-label="Explore themes">
        <button
          type="button"
          role="tab"
          aria-selected={activeKeywordId === 'all'}
          className={`explore-theme${activeKeywordId === 'all' ? ' active' : ''}`}
          onClick={() => setActiveKeywordId('all')}
        >
          All
        </button>
        {keywords.map((kw) => (
          <span key={kw.id} className="explore-theme-group">
            <span className="explore-theme-sep" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              role="tab"
              aria-selected={activeKeywordId === kw.id}
              className={`explore-theme${activeKeywordId === kw.id ? ' active' : ''}`}
              onClick={() => setActiveKeywordId(kw.id)}
            >
              <span className="explore-theme-translit">{kw.transliteration}</span>
              {kw.translation ? (
                <>
                  {' '}
                  <span className="explore-theme-translation">{kw.translation}</span>
                </>
              ) : null}
            </button>
          </span>
        ))}
      </div>

      <div className="explore-list">
        {displayed.length ? (
          displayed.map((entry, idx) => {
            const { bucket, item, formatTag } = entry;
            const relKey = entryKey(entry, idx);
            const title = getExploreItemTitle(item, bucket);
            const subtitle = getExploreItemSubtitle(item, bucket, title);
            const descPlain = getExploreItemDescription(item, bucket);
            const expanded = !!expandedRows[relKey];
            const newlineCount = (descPlain.match(/\n/g) || []).length;
            const needsClamp = descPlain.length > 140 || newlineCount >= 2;
            const detailHref = getRelatedDetailHref(bucket, item);
            const thumb = resolveCmsAssetUrl(
              item.thumbnailUrl || item.thumbnail_url || item.thumbnailUrl
            );

            const inner = (
              <>
                <div className="explore-thumb">
                  {thumb ? <img src={thumb} alt={title} /> : null}
                </div>
                <div className="explore-body">
                  <div className="explore-titlerow">
                    <span className="explore-itemtitle">{title}</span>
                    {subtitle ? (
                      <span className="explore-itemsubtitle">{subtitle}</span>
                    ) : null}
                  </div>
                  {clampLines ? (
                    <p
                      className="explore-itemdesc explore-itemdesc--clamped"
                      style={{ WebkitLineClamp: clampLines }}
                    >
                      {descPlain}
                    </p>
                  ) : (
                    <p className="explore-itemdesc">
                      {needsClamp && !expanded
                        ? truncateAtWord(descPlain, 140)
                        : descPlain}
                      {needsClamp ? (
                        <button
                          type="button"
                          className="explore-readmore"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedRows((prev) => ({
                              ...prev,
                              [relKey]: !prev[relKey],
                            }));
                          }}
                        >
                          {expanded ? ' read less' : '...more'}
                        </button>
                      ) : null}
                    </p>
                  )}
                  <div className="explore-format">{formatTag}</div>
                </div>
              </>
            );

            return detailHref ? (
              <Link
                key={relKey}
                href={withAppBasePath(detailHref)}
                className="explore-item explore-item--link"
              >
                {inner}
              </Link>
            ) : (
              <div key={relKey} className="explore-item">
                {inner}
              </div>
            );
          })
        ) : (
          <div className="explore-empty">No related items.</div>
        )}
      </div>

      {hasMore ? (
        <button
          type="button"
          className="explore-seemore"
          onClick={() => setListExpanded((v) => !v)}
        >
          {listExpanded ? 'SEE LESS' : 'SEE MORE'}
        </button>
      ) : null}
    </section>
  );
}
