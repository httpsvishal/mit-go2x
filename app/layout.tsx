import type { Metadata } from 'next';
import './globals.css';
import { Toast } from '@/components/common/Toast';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Production-quality, modular manifest-driven attendance analytics dashboard',
  icons: {
    icon: '/logo_noBg.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-go2x-bg text-go2x-text antialiased">
        {children}
        <Toast />
      </body>
    </html>
  );
}
