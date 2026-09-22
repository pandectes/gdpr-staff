import { SES } from '@aws-sdk/client-ses';
import { config, hasSesCredentials } from './config';

const ses = hasSesCredentials ? new SES(config.ses) : null;

const pinEmailHtml = (pin: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0f172a">
  <h1 style="font-size:18px;margin:0 0 8px">Pandectes Staff sign-in</h1>
  <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 24px">
    Use this code to finish signing in. It expires in ${Math.round(config.pin.ttl / 60)} minutes.
  </p>
  <p style="font-size:34px;letter-spacing:10px;font-weight:700;margin:0 0 24px">${pin}</p>
  <p style="font-size:12px;line-height:20px;color:#64748b;margin:0">
    If you did not try to sign in, ignore this email and tell the team.
  </p>
</div>`;

/** Mails the sign-in PIN. Without SES credentials (local dev) it logs the PIN instead. */
export async function sendPinEmail(to: string, pin: string): Promise<void> {
  if (!ses) {
    console.info(`\n  [staff] sign-in PIN for ${to}: ${pin}\n`);
    return;
  }

  await ses.sendEmail({
    Source: `${config.appName} <${config.email.noReply}>`,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `${pin} is your Pandectes Staff sign-in code` },
      Body: { Html: { Data: pinEmailHtml(pin) } },
    },
  });
}
