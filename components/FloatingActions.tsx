'use client';

import { useState } from 'react';
import { ChevronUp, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, X } from 'lucide-react';

export default function FloatingActions() {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://ajabshahar.org';
    const title = typeof document !== 'undefined' ? document.title : 'Ajab Shahar';
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    if (platform === 'copy') {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch (err) {
        console.error('Copy failed:', err);
        window.prompt('Copy this link:', url);
      }
      return;
    }

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    };

    const shareUrl = shareUrls[platform];
    if (!shareUrl) return;

    const popup = window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = shareUrl;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="floating-actions">
      <button
        type="button"
        onClick={scrollToTop}
        className="floating-action-btn scroll-top-btn visible"
        aria-label="Scroll to top"
      >
        <ChevronUp size={20} />
      </button>

      <div className="share-wrapper">
        <button
          type="button"
          onClick={() => setShowShareMenu((p) => !p)}
          className="floating-action-btn share-btn"
          aria-label="Share"
        >
          {showShareMenu ? <X size={20} /> : <Share2 size={20} />}
        </button>

        {showShareMenu && (
          <div className="share-menu">
            <button
              type="button"
              onClick={() => void handleShare('facebook').catch(() => {})}
              aria-label="Share on Facebook"
              title="Facebook"
            >
              <Facebook size={16} />
            </button>
            <button
              type="button"
              onClick={() => void handleShare('twitter').catch(() => {})}
              aria-label="Share on Twitter"
              title="Twitter"
            >
              <Twitter size={16} />
            </button>
            <button
              type="button"
              onClick={() => void handleShare('linkedin').catch(() => {})}
              aria-label="Share on LinkedIn"
              title="LinkedIn"
            >
              <Linkedin size={16} />
            </button>
            <button
              type="button"
              onClick={() => void handleShare('whatsapp').catch(() => {})}
              aria-label="Share on WhatsApp"
              title="WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .17 5.33.17 11.88c0 2.09.55 4.13 1.6 5.93L0 24l6.34-1.66a11.86 11.86 0 0 0 5.7 1.45h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.16-3.41-8.43zM12.05 21.5h-.01a9.6 9.6 0 0 1-4.9-1.34l-.35-.21-3.76.99 1-3.66-.23-.38a9.6 9.6 0 0 1-1.46-5.02c0-5.31 4.32-9.62 9.63-9.62 2.57 0 4.99 1 6.81 2.82a9.55 9.55 0 0 1 2.82 6.81c0 5.31-4.32 9.62-9.55 9.62zm5.27-7.2c-.29-.14-1.71-.84-1.97-.94-.27-.1-.46-.14-.65.14-.19.29-.74.94-.91 1.13-.17.19-.34.21-.62.07-.29-.14-1.21-.45-2.31-1.42-.85-.76-1.43-1.7-1.6-1.99-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.23-.56-.47-.49-.65-.5l-.55-.01c-.19 0-.5.07-.76.36s-1 .98-1 2.39 1.02 2.77 1.17 2.96c.14.19 2.02 3.08 4.89 4.32.68.29 1.21.47 1.63.6.69.22 1.31.19 1.81.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33z"/></svg>
            </button>
            <button
              type="button"
              onClick={() => void handleShare('copy').catch(() => {})}
              aria-label="Copy link"
              title={copied ? 'Copied!' : 'Copy link'}
              className={copied ? 'copied' : ''}
            >
              <LinkIcon size={16} />
            </button>
          </div>
        )}
        {copied && <span className="copied-toast">Link copied!</span>}
      </div>
    </div>
  );
}
