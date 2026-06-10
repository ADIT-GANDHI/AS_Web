'use client';

import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import './WavyPaperPopup.css';

// ──────────────────────────────────────────────────────────────────────
// WavyPaperPopup — single popup primitive for the entire app.
//
// Two visual variants share the same wavy paper-card artwork:
//   "inline"   → stays in the page flow; consumers position with margin /
//                wrapper. Used for Song Notes (lyrics column).
//   "anchored" → fixed/centered overlay sheet with backdrop. Used for
//                Glossary popup on Songs/Poems/Reflections.
//
// All consumers reuse the same close button / title / body, so a future
// design tweak (paper colour, fold accent, close icon size, etc.) lands
// in one place and propagates everywhere.
// ──────────────────────────────────────────────────────────────────────

type Variant = 'inline' | 'anchored';

interface BaseProps {
  isOpen?: boolean; // anchored only — inline ignores
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Override / extend the popup's outer style (sizing, anchor position). */
  style?: CSSProperties;
  /** Anchor sheet right offset (anchored variant only). Defaults to a
   *  responsive clamp() that sits inside the spotlight circle. */
  rightAnchor?: string | number;
}

export interface WavyPaperPopupProps extends BaseProps {
  variant?: Variant;
}

export default function WavyPaperPopup({
  variant = 'anchored',
  isOpen = true,
  onClose,
  title,
  children,
  className = '',
  style,
  rightAnchor,
}: WavyPaperPopupProps) {
  if (variant === 'inline') {
    if (!isOpen) return null;
    return (
      <div className={`wp-popup wp-popup--inline ${className}`} style={style}>
        {title && (
          <div className="wp-popup-header">
            <h3 className="wp-popup-title">{title}</h3>
          </div>
        )}
        {onClose && (
          <button
            type="button"
            className="wp-popup-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
        <div className="wp-popup-body">{children}</div>
      </div>
    );
  }

  const z = style?.zIndex;
  const sheetZ = typeof z === 'number' ? z : 10100;
  const backdropZ = sheetZ - 1;

  const anchoredStyle: CSSProperties = {
    top: '50%',
    right: rightAnchor ?? 'clamp(280px, 25vw, 480px)',
    transform: 'translateY(-50%)',
    ...style,
    zIndex: sheetZ,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: backdropZ, background: 'rgba(0,0,0,0.05)' }}
            onClick={onClose}
          />
          <motion.div
            className={`wp-popup wp-popup--anchored fixed ${className}`}
            style={anchoredStyle}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            {onClose && (
              <button
                type="button"
                className="wp-popup-close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
            {title && <h3 className="wp-popup-title">{title}</h3>}
            <div className="wp-popup-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
