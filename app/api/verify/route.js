import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const users = await sql`
    SELECT id FROM users WHERE verification_token = ${token}
  `;

  if (users.length === 0) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  await sql`
    UPDATE users SET verified = true, verification_token = NULL WHERE verification_token = ${token}
  `;

  return NextResponse.redirect(new URL('/login?verified=true', req.url));
}