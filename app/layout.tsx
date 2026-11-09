import type { Metadata, Viewport } from 'next';
import { SKETCHFAB_SCRIPT } from '@/lib/sketchfab';
import './globals.css';

const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..700&display=swap';

export const metadata: Metadata = {
  metadataBase: new URL('https://jjautos.sanylax.com'),
  title: 'JJ Autos | Performance car rentals in Cupertino',
  description:
    'Rent a Corvette C8, BMW M4 Competition, or Tesla Model S Plaid from JJ Autos, an owner-run rental business in Cupertino, California. Pickup or Bay Area delivery.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'JJ Autos | Performance car rentals in Cupertino',
    description:
      'Owner-run performance car rentals in Cupertino, California.',
    type: 'website',
    images: [
      {
        url: '/jj-autos-social-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'JJ Autos: performance car rentals in Cupertino, with a photo of the red Corvette',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JJ Autos | Performance car rentals in Cupertino',
    description:
      'Owner-run performance car rentals in Cupertino, California.',
    images: ['/jj-autos-social-preview.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1011',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Start the 3D viewer download during HTML parsing instead of after
            React hydrates, so the first car shows up sooner. */}
        <link rel="preconnect" href="https://static.sketchfab.com" />
        <link rel="preconnect" href="https://sketchfab.com" />
        <link rel="dns-prefetch" href="https://media.sketchfab.com" />
        <link rel="preload" href={SKETCHFAB_SCRIPT} as="script" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={FONT_STYLESHEET} />
      </head>
      <body>{children}</body>
    </html>
  );
}
