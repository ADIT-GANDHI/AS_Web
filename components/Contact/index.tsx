'use client';

import { FormEvent, useState } from 'react';
import './Contact.css';

const YOUTUBE_URL = 'https://www.youtube.com/@kabirproject';
const INSTAGRAM_URL = 'https://www.instagram.com/thekabirproject/';

export default function Contact() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joinMailing, setJoinMailing] = useState(true);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    // UI-only for now — wire to API / mailto later
  };

  return (
    <div className="contact-page">
      <div className="contact-column">
        <h1 className="contact-title">Contact Us</h1>

        <p className="contact-intro">
          We would love to hear from you.
          <br />
          Please fill out the form below or write to us at{' '}
          <a href="mailto:team@kabirproject.com" className="contact-link">
            team@kabirproject.com
          </a>
        </p>

        <form className="contact-form" onSubmit={onSubmit} noValidate>
          {/* AI/PDF: grey tags sit inside the fields as placeholders */}
          <input
            className="contact-input"
            type="text"
            name="subject"
            placeholder="subject"
            aria-label="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoComplete="off"
          />

          <textarea
            className="contact-input contact-input--message"
            name="message"
            placeholder="your message"
            aria-label="your message"
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <input
            className="contact-input"
            type="text"
            name="name"
            placeholder="your name"
            aria-label="your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />

          <input
            className="contact-input"
            type="email"
            name="email"
            placeholder="your email"
            aria-label="your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="contact-mailing">
            <input
              type="checkbox"
              checked={joinMailing}
              onChange={(e) => setJoinMailing(e.target.checked)}
            />
            <span>Join our mailing list to receive news, events and more</span>
          </label>

          <button type="submit" className="contact-submit">
            submit
          </button>
        </form>

        <p className="contact-social">
          Follow us on{' '}
          <a href={YOUTUBE_URL} className="contact-link" target="_blank" rel="noreferrer">
            Youtube
          </a>
          {' | '}
          <a href={INSTAGRAM_URL} className="contact-link" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </p>

        <address className="contact-address">
          <p>Ajab Shahar is housed at</p>
          <p className="contact-address-org">Shabad Dhun Foundation</p>
          <p>MU 210, Townsend Layout Avalahalli</p>
          <p>SN Halli Post, Doddaballapur Road</p>
          <p>Yelahanka New Town, Bangalore 560064</p>
          <p>Karnataka, India</p>
        </address>
      </div>
    </div>
  );
}
