import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { email: rawEmail } = await req.json();
  const email = rawEmail.toLowerCase().trim();

  const users = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (users.length === 0) {
    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await sql`
    UPDATE users SET reset_token = ${token}, reset_token_expires = ${expires}
    WHERE email = ${email}
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Match Engine <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your Match Engine password',
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${token}">Reset my password</a>
    `,
  });

  return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
}