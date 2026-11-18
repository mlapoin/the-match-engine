import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function POST(req, context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const matchId = parseInt(params.matchId);

  if (isNaN(matchId)) return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const myChars = await sql`SELECT id FROM characters WHERE user_id = ${user.id}`;
  const myIds = myChars.map(c => c.id);

  await sql`
    UPDATE messages 
    SET read_at = NOW()
    WHERE match_id = ${matchId}
    AND sender_character_id != ALL(${myIds}::int[])
    AND read_at IS NULL
  `;

  return NextResponse.json({ ok: true });
}