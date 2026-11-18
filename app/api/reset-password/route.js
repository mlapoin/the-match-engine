import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const users = await sql`
    SELECT * FROM users 
    WHERE reset_token = ${token} 
    AND reset_token_expires > NOW()
  `;

  if (users.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await sql`
    UPDATE users 
    SET password = ${hashed}, verified = true, reset_token = NULL, reset_token_expires = NULL
    WHERE reset_token = ${token}
  `;

  return NextResponse.json({ message: 'Password reset successfully' });
}