'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { footerLinks } from '@/lib/data';
import '../styles/Footer.css';
import Image from 'next/image';
import footerLogo from '../public/k_logo.svg';

export default function Footer() {
  const [email, setEmail] = useState('');
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="text-white footer-bg relative">
      <div className="footer-content-max-width mx-auto">
        <div className="footer-inner">
          <div className="footer-content footer-content--about">
            <h3 className="footer-heading-text">About</h3>
            <p className="text-gray-footer text-gray-footer--about">
              Ajab Shahar is a wondrous city of songs, poems and conversations from Bhakti, Sufi
              and Baul folk traditions. Bringing this to you is a small team at the Kabir
              Project&hellip;
            </p>
          </div>

          <div className="footer-content footer-content--support">
            <h3 className="footer-heading-text">Support</h3>
            <p className="text-gray-footer text-gray-footer--support">
              We hope you have found joy and value here and will consider supporting this work to
              keep it alive and help it grow!
            </p>
          </div>

          <div className="footer-content footer-content--connect">
            <h3 className="footer-heading-text">Connect</h3>
            <p className="text-gray-footer text-gray-footer--connect">
              Subscribe for news, events &amp; more&hellip;
            </p>

            <form onSubmit={handleSubscribe} className="footer-form">
              <input
                type="email"
                placeholder="youremail@gmail.com"
                id="email-subscrib"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="footer-email-input"
                required
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="footer-email-send"
                aria-label="Subscribe"
              >
                <Send size={16} strokeWidth={2} aria-hidden />
              </button>
            </form>

            <div className="footer-connect-links">
              <p className="text-gray-footer footer-social-text">
                Follow{' '}
                {footerLinks.social.map((link, index) => (
                  <span key={link.name}>
                    <a href={link.href} className="pink footer-social-link">
                      {link.name}
                    </a>
                    {index < footerLinks.social.length - 1 && ' | '}
                  </span>
                ))}
              </p>
              <p className="text-gray-footer footer-write-text">
                Contact{' '}
                <a href="mailto:thekabirproject@gmail.com" className="pink footer-email-link">
                  thekabirproject@gmail.com
                </a>
              </p>
            </div>
          </div>

          <div className="footer-content footer-content--nav flex flex-col gap-3.5 mt-0.5">
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

        <div className="footer-credits">
          <p className="footer-credits__text footer-credits__text--left">
            Created by the <strong>Kabir Project</strong>
          </p>
          <div className="footer-credits__logo">
            <Image src={footerLogo} alt="Kabir Project" width={130} height={128} />
          </div>
          <p className="footer-credits__text footer-credits__text--right">
            Designed by <strong>Smriti Chanchani</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
