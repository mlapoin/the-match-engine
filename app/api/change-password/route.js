import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  const users = await sql`SELECT * FROM users WHERE email = ${session.user.email}`;
  const user = users[0];
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await sql`UPDATE users SET password = ${hashed} WHERE id = ${user.id}`;

  return NextResponse.json({ message: 'Password updated successfully' });
}
