import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'Booking <noreply@example.com>';

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  priceCents: number;
  businessName: string;
  address: string | null;
  phone: string | null;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const priceFormatted = `${(data.priceCents / 100).toFixed(2)} €`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: data.clientEmail,
    subject: `Jūsų vizitas patvirtintas — ${data.businessName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="margin: 0 0 24px;">Sveiki, ${data.clientName}!</h2>
        <p style="color: #555; margin: 0 0 24px;">Jūsų vizitas sėkmingai užregistruotas.</p>
        <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px;"><strong>Paslauga:</strong> ${data.serviceName}</p>
          <p style="margin: 0 0 8px;"><strong>Data:</strong> ${data.date}</p>
          <p style="margin: 0 0 8px;"><strong>Laikas:</strong> ${data.startTime} — ${data.endTime}</p>
          <p style="margin: 0 0 8px;"><strong>Trukmė:</strong> ${data.durationMin} min</p>
          <p style="margin: 0;"><strong>Kaina:</strong> ${priceFormatted}</p>
        </div>
        ${data.address ? `<p style="color: #555; margin: 0 0 16px;"><strong>Adresas:</strong> ${data.address}</p>` : ''}
        <p style="color: #888; font-size: 14px; margin: 0;">
          Jei negalite atvykti, praneškite iš anksto${data.phone ? ` tel. ${data.phone}` : ''}.
        </p>
      </div>
    `,
  });
}

export async function sendBookingReminder(data: BookingEmailData) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: data.clientEmail,
    subject: `Priminimas: rytoj jūsų vizitas — ${data.businessName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="margin: 0 0 24px;">Sveiki, ${data.clientName}!</h2>
        <p style="color: #555; margin: 0 0 24px;">Primename apie rytojaus vizitą.</p>
        <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px;"><strong>Paslauga:</strong> ${data.serviceName}</p>
          <p style="margin: 0 0 8px;"><strong>Data:</strong> ${data.date}</p>
          <p style="margin: 0 0 8px;"><strong>Laikas:</strong> ${data.startTime} — ${data.endTime}</p>
          <p style="margin: 0;"><strong>Kaina:</strong> ${(data.priceCents / 100).toFixed(2)} €</p>
        </div>
        ${data.address ? `<p style="color: #555; margin: 0 0 16px;"><strong>Adresas:</strong> ${data.address}</p>` : ''}
        <p style="color: #888; font-size: 14px; margin: 0;">
          Jei negalite atvykti, praneškite iš anksto${data.phone ? ` tel. ${data.phone}` : ''}.
        </p>
      </div>
    `,
  });
}

export async function sendReviewRequest(
  clientEmail: string,
  clientName: string,
  businessName: string,
  bookingId: string,
  appUrl: string
) {
  const reviewUrl = `${appUrl}/review/${bookingId}`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: clientEmail,
    subject: `Kaip sekėsi? — ${businessName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 16px; text-align: center;">
        <h2 style="margin: 0 0 16px;">Dėkojame, kad apsilankėte!</h2>
        <p style="color: #555; margin: 0 0 32px;">
          Mums svarbi jūsų nuomonė. Palikite atsiliepimą — tai užtruks tik minutę.
        </p>
        <a href="${reviewUrl}" style="display: inline-block; background: #171717; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Palikite atsiliepimą
        </a>
      </div>
    `,
  });
}
