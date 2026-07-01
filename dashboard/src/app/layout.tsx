import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Hunter's Auto Adv — Discord Automation",
  description: 'Automate Discord channels, DMs, and manage multiple accounts from one dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-900 text-accent min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
