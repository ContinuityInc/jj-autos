import type { Metadata, Viewport } from 'next';
import './globals.css';
import './overrides.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://jjautos.sanylax.com'),
  title: 'JJ Autos | Performance car rentals',
  description:
    'JJ Autos rents performance cars in Cupertino, California. Owner-operated service includes pickup and Bay Area delivery requests.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'JJ Autos | Performance car rentals',
    description:
      'Owner-operated performance car rentals in Cupertino, California.',
    type: 'website',
    images: [
      {
        url: '/jj-autos-social-preview.png',
        width: 1200,
        height: 630,
        alt: 'JJ Autos owner-operated performance rentals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JJ Autos | Performance car rentals',
    description:
      'Owner-operated performance car rentals in Cupertino, California.',
    images: ['/jj-autos-social-preview.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141210',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://static.sketchfab.com" />
        <link rel="preconnect" href="https://media.sketchfab.com" />
        <link rel="dns-prefetch" href="https://sketchfab.com" />
        <link
          rel="preload"
          href="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"
          as="script"
        />
        <link rel="preload" href="/fleet-corvette.jpg" as="image" />
      </head>
      <body>{children}</body>
    </html>
  );
}
