import type React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import '@/styles/CustomStyle.css';
import '@/styles/Footer.css';
import FloatingActions from '@/components/FloatingActions';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Ajab Shahar - A Wondrous City of Songs, Poems and Conversations',
  description:
    'Explore the rich oral traditions of Bhakti, Sufi and Baul from India and beyond through songs, poems, reflections, people and films.',
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <body className="font-sans antialiased">
        {children}
        <Footer />
        <FloatingActions />
      </body>
    </html>
  );
}
