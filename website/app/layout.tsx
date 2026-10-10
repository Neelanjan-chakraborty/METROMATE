import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/outfit';
import '@fontsource-variable/inter';
import '@fontsource/reenie-beanie';
import './globals.css';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'MetroMate — A calmer way through the city',
  description: site.description,
  applicationName: site.name,
  keywords: ['Ahmedabad metro', 'Gandhinagar metro', 'GMRC', 'BRTS', 'AMTS', 'offline metro map', 'MetroMate'],
  openGraph: {
    title: 'MetroMate — A calmer way through the city',
    description: site.description,
    type: 'website',
    siteName: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: '#FDFCF8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="sr-only z-[70] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
