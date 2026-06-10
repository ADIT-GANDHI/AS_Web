'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import './RelatedSection.css';

export interface RelatedItem {
  id: string;
  type: string;
  title: string;
  titleSecondary?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  link?: string;
}

export interface RelatedTab {
  key: string;
  label: string;
  count: number;
}

interface RelatedSectionProps {
  items: RelatedItem[];
  tabs: RelatedTab[];
  initialLimit?: number;
  title?: string;
}

export default function RelatedSection({
  items,
  tabs,
  initialLimit = 3,
  title = 'Related',
}: RelatedSectionProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'all');
  const [expanded, setExpanded] = useState(false);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((item) => item.type === activeTab);
  }, [items, activeTab]);

  const hasMore = filteredItems.length > initialLimit;
  const gridRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setExpanded(false);
  };

  // Smooth height animation
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    // Set explicit height before transition
    el.style.height = el.scrollHeight + 'px';
    const timer = setTimeout(() => {
      el.style.height = 'auto';
    }, 400);
    return () => clearTimeout(timer);
  }, [expanded, activeTab]);

  if (!items.length) return null;

  // Always render all items but control visibility via CSS for smooth animation
  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, initialLimit);

  return (
    <section className="related-section-wrap">
      <h3 className="related-section-title">{title}</h3>

      {/* Tabs */}
      <div className="related-section-tabs">
        {tabs.map((tab, index) => (
          <React.Fragment key={tab.key}>
            <button
              type="button"
              className={`related-section-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}<span className="related-section-tab-count">({tab.count})</span>
            </button>
            {index < tabs.length - 1 && (
              <span className="related-section-tab-sep">|</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Items List */}
      <div ref={gridRef} className="related-section-grid">
        {visibleItems.length ? (
          visibleItems.map((item, index) => (
            <article
              key={item.id}
              className="related-section-card"
              style={{
                animationDelay: expanded && index >= initialLimit ? `${(index - initialLimit) * 0.08}s` : '0s',
              }}
            >
              <div className="related-section-card-thumb-wrap">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="related-section-card-thumb" />
                ) : (
                  <div className="related-section-card-thumb related-section-card-thumb-empty" />
                )}
              </div>
              <div className="related-section-card-content">
                <h4 className="related-section-card-title">
                  <span>{item.title}</span>
                  {!!item.titleSecondary && item.titleSecondary !== item.title && (
                    <span className="related-section-card-title-secondary"> {item.titleSecondary}</span>
                  )}
                </h4>
                {!!item.subtitle && <p className="related-section-card-subtitle">{item.subtitle}</p>}
                {!!item.description && (
                  <p
                    className="related-section-card-desc"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="related-section-empty">No related items in this category.</p>
        )}
      </div>

      {/* SEE ALL / SHOW LESS */}
      {hasMore && (
        <button
          type="button"
          className="related-section-see-all"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'SHOW LESS' : 'SEE MORE'}
        </button>
      )}
    </section>
  );
}

function RelatedDescClamp({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const baseStyle: React.CSSProperties = expanded
    ? {}
    : {
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      };
  return (
    <>
      <p
        className="related-section-card-desc"
        style={baseStyle}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            color: '#E31E79',
            background: 'transparent',
            border: 0,
            padding: 0,
            marginTop: 4,
            cursor: 'pointer',
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: 13,
          }}
        >
          ...more
        </button>
      )}
    </>
  );
}
