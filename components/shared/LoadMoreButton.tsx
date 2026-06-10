'use client';

import { ChevronDown } from 'lucide-react';

type LoadMoreButtonProps = {
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
};

/** Pink “Load More” + single down chevron — shared across listing pages. */
export default function LoadMoreButton({
  onClick,
  ariaLabel = 'Load more',
  disabled = false,
}: LoadMoreButtonProps) {
  return (
    <div className="cl-load-more-wrap">
      <button
        type="button"
        className="cl-load-more-btn"
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span>Load More</span>
        <ChevronDown size={22} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
