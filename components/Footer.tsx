'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { footerLinks } from '@/lib/data';
import '../styles/Footer.css';
import Image from 'next/image';
import footerLogo from '../public/k_logo.svg';

const DEFAULT_NEWS_HEADING = 'Stay Connected';
const DEFAULT_NEWS_SUBTEXT = 'Hear from us quarterly with news, inspirations and more...';

export type FooterProps = {
  newsHeading?: string;
  newsSubtext?: React.ReactNode;
};

export default function Footer({
  newsHeading = DEFAULT_NEWS_HEADING,
  newsSubtext = DEFAULT_NEWS_SUBTEXT,
}: FooterProps) {
  const [email, setEmail] = useState('');
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="text-white footer-bg relative">
      <div className="">
        <div className="footer-content-max-width mx-auto">
          <div className="footer-inner">
            {/* About Section */}
            <div className="footer-content">
              <h3 className="footer-heading-text">About</h3>
              <p className="text-gray-footer text-gray-footer--about">
                Ajab Shahar is a wondrous city of songs, poems and conversations from Bhakti, Sufi
                and Baul oral traditions from India and beyond.
              </p>
              <div className="footer-support-seaction">
                <h3 className="footer-heading-text">Support</h3>
                <p className="text-gray-footer text-gray-footer--support">
                  If you have found joy and value here please consider supporting this work.
                </p>
              </div>
            </div>

            {/* Newsletter column */}
            <div className="footer-content">
              <h3 className="footer-heading-text footer-heading-text--stay">{newsHeading}</h3>
              <p className="text-gray-footer text-gray-footer--stay mb-4">{newsSubtext}</p>

              <form onSubmit={handleSubscribe} className="flex footer-form">
                <input
                  type="email"
                  placeholder="Email"
                  id="email-subscrib"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white border-0 rounded-l focus:outline-none email-input"
                  required
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  className="rounded-r transition-colors cursor-pointer email-subscribe"
                >
                  Subscribe
                </button>
              </form>

              <div className="mt-5">
                <p className="text-gray-footer text-sm footer-write-text">
                  Write to us at{' '}
                  <a href="mailto:ajabshahar@gmail.com" className="pink footer-email-link">
                    ajabshahar@gmail.com
                  </a>
                </p>
                <p className="text-gray-footer text-sm mt-1 footer-social-text">
                  Follow us on{' '}
                  {footerLinks.social.map((link, index) => (
                    <span key={link.name}>
                      <a href={link.href} className="pink footer-social-link">
                        {link.name}
                      </a>
                      {index < footerLinks.social.length - 1 && ' | '}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="footer-content flex flex-col gap-3.5 mt-0.5">
              {footerLinks.main.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="pink transition-colors text-left cursor-pointer"
                  style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '16px',
                    lineHeight: '100%',
                    letterSpacing: '0',
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 footer-border text-center">
            <div className="flex justify-center footer-logo">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Image src={footerLogo} alt="Kabir Project" width={100} />
                <span
                  style={{
                    position: 'absolute',
                    left: '78%',
                    bottom: '14%',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontWeight: 300,
                    fontStyle: 'normal',
                    fontSize: '11.91px',
                    lineHeight: '100%',
                    letterSpacing: '0',
                    color: '#E6E6E6',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Kabir Project
                </span>
              </div>
            </div>
            <p
              style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontWeight: 300,
                fontStyle: 'normal',
                fontSize: '14px',
                lineHeight: '1.5',
                letterSpacing: '0',
                marginTop: '24px',
                color: '#B3B3B3',
              }}
            >
              <span style={{ color: '#B3B3B3' }}>Website Design </span>
              <span style={{ color: '#FFFFFF' }}>Smriti Chanchani</span>
              <span style={{ color: '#B3B3B3' }}> | Created by the </span>
              <span style={{ color: '#FFFFFF' }}>Kabir Project</span>
              <span style={{ color: '#B3B3B3' }}> at </span>
              <span style={{ color: '#FFFFFF' }}>Shabad Dhun Foundation</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
