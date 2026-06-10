'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import PrevIcon from '../public/left-arrow.svg';
import NextIcon from '../public/right-arrow.svg';

import '../styles/CLModalStyle.css';

export interface NewsPopupSlide {
  slideId: string;
  newsId: string;
  category: 'single' | 'multiple';
  title: string;
  secondTitle?: string;
  content?: string;
  images: string[];
}

interface ContentSliderModalProps {
  items: NewsPopupSlide[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function CLContentSliderModal({
  items,
  isOpen,
  onClose,
  initialIndex = 0,
}: ContentSliderModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const router = useRouter();

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !items.length) return null;

  const item = items[activeIndex];

  const goPrev = () => setActiveIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % items.length);

  const openDetails = () => {
    onClose();
    router.push(`/ajab-news?news_id=${encodeURIComponent(item.newsId)}`);
  };

  return (
    <div
      className="npc-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="npc-card">
        {/* "ajab news" label */}
        <span className="npc-label">ajab news</span>

        {/* Close button */}
        <button className="npc-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Image */}
        <div className="npc-image-wrap">
          <img src={item.images[0]} alt={item.title} className="npc-image" />
        </div>

        {/* Navigation arrows — shown only when multiple slides */}
        {items.length > 1 && (
          <>
            <button className="npc-arrow npc-arrow--prev" onClick={goPrev} aria-label="Previous">
              <Image src={PrevIcon} alt="" width={14} height={25} style={{ width: 'auto', height: '100%' }} />
            </button>
            <button className="npc-arrow npc-arrow--next" onClick={goNext} aria-label="Next">
              <Image src={NextIcon} alt="" width={14} height={25} style={{ width: 'auto', height: '100%' }} />
            </button>
          </>
        )}

        {/* [Claude] these changes have been recommended by claude — text block holds title + content only.
            EXPLORE is rendered outside the flex block and pinned absolutely to the card so it
            is always visible at a fixed position regardless of title wrap or body text length. */}
        <div className="npc-text-block">
          <div className="npc-title">
            {item.title}
            {item.secondTitle && <span className="npc-by"> {item.secondTitle}</span>}
          </div>

          {/* Body content — clamped to 3 lines */}
          {item.content && (
            <p className="npc-content">
              {item.content
                .replace(/\r?\n|\r/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()}
            </p>
          )}
        </div>

        {/* EXPLORE CTA — absolutely pinned to card bottom, never affected by content length */}
        <button className="npc-explore" onClick={openDetails}>
          EXPLORE
        </button>
      </div>
    </div>
  );
}
