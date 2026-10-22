'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Printer } from 'lucide-react';

export default function AdminQRPage() {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || '';
  const bookingUrl = `${appUrl}/booking`;

  useEffect(() => {
    if (!bookingUrl) return;
    QRCode.toDataURL(bookingUrl, {
      width: 800,
      margin: 2,
      color: { dark: '#171717', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [bookingUrl]);

  function downloadQR() {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${businessName || 'booking'}.png`;
    link.href = qrDataUrl;
    link.click();
  }

  function printCard() {
    window.print();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">QR Kodas</h1>

      <div className="max-w-sm mx-auto">
        {/* Printable card */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center print:border-0 print:shadow-none" id="qr-card">
          {businessName && (
            <h2 className="text-lg font-semibold mb-4">{businessName}</h2>
          )}
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-64 h-64 mx-auto mb-4"
            />
          ) : (
            <div className="w-64 h-64 mx-auto mb-4 bg-muted rounded-lg animate-pulse" />
          )}
          <p className="text-sm text-muted-foreground">Registruotis internetu</p>
          {appUrl && (
            <p className="text-xs text-muted-foreground/60 mt-1 break-all">{bookingUrl}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 print:hidden">
          <button
            onClick={downloadQR}
            disabled={!qrDataUrl}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Atsisiųsti PNG
          </button>
          <button
            onClick={printCard}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Printer className="h-4 w-4" />
            Spausdinti
          </button>
        </div>
      </div>
    </div>
  );
}
