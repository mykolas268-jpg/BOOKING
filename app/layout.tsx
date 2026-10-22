import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Booking';

export const metadata: Metadata = {
  title: {
    default: businessName,
    template: `%s | ${businessName}`,
  },
  description: `Registruokitės vizitui internetu — ${businessName}`,
  openGraph: {
    title: businessName,
    description: `Registruokitės vizitui internetu — ${businessName}`,
    type: 'website',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="lt" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
