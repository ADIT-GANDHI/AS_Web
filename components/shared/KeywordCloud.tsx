'use client';

import Link from 'next/link';
import { keywordSearchHref } from '@/lib/parseKeywords';

type Props = {
  terms: string[];
  className?: string;
  style?: React.CSSProperties;
};

/** Linked keyword cloud — routes to site search (`/searche`). */
export default function KeywordCloud({ terms, className = '', style }: Props) {
  if (!terms.length) return null;

  return (
    <div className={`cld-keywords-wrap ${className}`.trim()} style={style}>
      {terms.map((word, wIdx) => (
        <span key={`${word}-${wIdx}`}>
          <Link href={keywordSearchHref(word)} className="cld-keyword-tag">
            {word}
          </Link>
          {wIdx < terms.length - 1 && <span className="cld-keyword-sep"> &amp; </span>}
        </span>
      ))}
    </div>
  );
}
