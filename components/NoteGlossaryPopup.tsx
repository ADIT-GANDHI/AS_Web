'use client';

import type { MouseEvent } from 'react';
import './NoteGlossaryPopup.css';

type PopupSide = 'left' | 'right';

interface NoteGlossaryPopupProps {
  title: string;
  content?: string | null;
  fallbackText: string;
  side: PopupSide;
  onClose: () => void;
  isHtml?: boolean;
}

export default function NoteGlossaryPopup({
  title,
  content,
  fallbackText,
  side,
  onClose,
  isHtml = false,
}: NoteGlossaryPopupProps) {
  const popupContent = content?.trim() ? content : fallbackText;

  const handleInnerClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className={`note-popup-overlay ${side}`} onClick={onClose}>
      <div className={`note-popup-card ${side}`} onClick={handleInnerClick}>
        <div className="note-popup-header">
          <span>{title}</span>
          <button type="button" aria-label={`Close ${title}`} onClick={onClose}>
            ×
          </button>
        </div>
        {isHtml ? (
          <div className="note-popup-body html" dangerouslySetInnerHTML={{ __html: popupContent }} />
        ) : (
          <div className="note-popup-body text">{popupContent}</div>
        )}
      </div>
    </div>
  );
}