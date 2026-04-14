import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { version, username, message } = await request.json();

    if (!version || !username || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: 'briefica feedback <noreply@briefica.com>',
      to: 'nhalws@gmail.com',
      subject: `[briefica feedback] ${version} — @${username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2b2b2b; padding: 32px; border-radius: 12px;">
            <div style="margin-bottom: 20px;">
              <img src="https://briefica.com/logo_6.png" alt="briefica" style="width: 140px; height: auto;" />
            </div>
            <div style="background-color: #1e1e1e; padding: 24px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Version</p>
              <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0; font-weight: bold;">${version}</p>

              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Username</p>
              <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px 0;">@${username}</p>

              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Feedback</p>
              <p style="color: rgba(255,255,255,0.85); font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[feedback] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[feedback] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
