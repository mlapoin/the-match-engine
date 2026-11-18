import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function DELETE(req, context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const matchId = parseInt(params.matchId);
  if (isNaN(matchId)) return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const myChars = await sql`SELECT id FROM characters WHERE user_id = ${user.id}`;
  const myIds = myChars.map(c => c.id);

  const match = await sql`
    SELECT id FROM matches
    WHERE id = ${matchId}
    AND (character_1_id = ANY(${myIds}::int[]) OR character_2_id = ANY(${myIds}::int[]))
  `;
  if (match.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`DELETE FROM messages WHERE match_id = ${matchId}`;
  await sql`DELETE FROM matches WHERE id = ${matchId}`;

  return NextResponse.json({ ok: true });
}
