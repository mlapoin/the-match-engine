import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

// Returns the character IDs owned by the logged-in user.
async function getMyCharacterIds(session) {
  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];
  if (!user) return [];
  const chars = await sql`SELECT id FROM characters WHERE user_id = ${user.id}`;
  return chars.map(c => c.id);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('match_id');
  if (!matchId) return NextResponse.json({ error: 'Missing match_id' }, { status: 400 });

  // Only let the caller read a thread they are actually part of.
  const myIds = await getMyCharacterIds(session);
  const match = await sql`
    SELECT id FROM matches
    WHERE id = ${matchId}
    AND (character_1_id = ANY(${myIds}::int[]) OR character_2_id = ANY(${myIds}::int[]))
  `;
  if (match.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const messages = await sql`
    SELECT m.*, c.name as sender_name, c.profile_pic as sender_pic
    FROM messages m
    JOIN characters c ON m.sender_character_id = c.id
    WHERE m.match_id = ${matchId}
    ORDER BY m.created_at ASC
  `;

  return NextResponse.json({ messages });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { match_id, sender_character_id, content } = await req.json();

  if (!match_id || !sender_character_id || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Must own the sending character AND that character must belong to this match.
  const myIds = await getMyCharacterIds(session);
  if (!myIds.includes(Number(sender_character_id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const match = await sql`
    SELECT id FROM matches
    WHERE id = ${match_id}
    AND (character_1_id = ${sender_character_id} OR character_2_id = ${sender_character_id})
  `;
  if (match.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const message = await sql`
    INSERT INTO messages (match_id, sender_character_id, content)
    VALUES (${match_id}, ${sender_character_id}, ${content})
    RETURNING *
  `;

  return NextResponse.json({ message: message[0] });
}
