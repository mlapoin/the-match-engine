import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT email, verified FROM users WHERE email = ${session.user.email}`;
  const user = users[0];
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ account: { email: user.email, verified: user.verified } });
}
