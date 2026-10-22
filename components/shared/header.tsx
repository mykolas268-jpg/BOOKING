import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  businessName: string;
}

export function Header({ businessName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          {businessName}
        </Link>
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Registruotis
        </Link>
      </div>
    </header>
  );
}
