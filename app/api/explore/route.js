import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vibe = searchParams.get('vibe');

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const myChars = await sql`SELECT id FROM characters WHERE user_id = ${user.id}`;
  const myIds = myChars.map(c => c.id);

  let characters;
  if (vibe) {
    characters = await sql`
      SELECT * FROM characters
      WHERE vibe = ${vibe}
      AND user_id != ${user.id}
      ORDER BY RANDOM()
      LIMIT 20
    `;
  } else {
    characters = await sql`
      SELECT * FROM characters
      WHERE user_id != ${user.id}
      ORDER BY RANDOM()
      LIMIT 20
    `;
  }

  return NextResponse.json({ characters });
}