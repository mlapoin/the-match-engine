import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { email: rawEmail, password } = await req.json();
  const email = rawEmail.toLowerCase().trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString('hex');

  await sql`
    INSERT INTO users (email, password, verification_token, verified)
    VALUES (${email}, ${hashed}, ${token}, false)
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Match Engine <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your Match Engine account',
    html: `
      <h2>Welcome to Match Engine</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${process.env.NEXTAUTH_URL}/api/verify?token=${token}">Verify my account</a>
    `,
  });

  return NextResponse.json({ message: 'Check your email to verify your account' });
}