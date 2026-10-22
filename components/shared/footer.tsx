import { MapPin, Phone, Mail } from 'lucide-react';

interface FooterProps {
  businessName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export function Footer({ businessName, address, phone, email }: FooterProps) {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h3 className="font-semibold text-lg mb-4">{businessName}</h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{address}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-foreground transition-colors">{phone}</a>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-foreground transition-colors">{email}</a>
            </div>
          )}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {businessName}
        </p>
      </div>
    </footer>
  );
}
