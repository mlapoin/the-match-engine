import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sender_character_id, receiver_character_id, message } = await req.json();

  if (!message || message.length > 140) {
    return NextResponse.json({ error: 'Message must be 1-140 characters' }, { status: 400 });
  }

  // The sending character must belong to the logged-in user.
  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owned = await sql`
    SELECT id FROM characters WHERE id = ${sender_character_id} AND user_id = ${user.id}
  `;
  if (owned.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await sql`
    INSERT INTO first_impressions (sender_character_id, receiver_character_id, message)
    VALUES (${sender_character_id}, ${receiver_character_id}, ${message})
    ON CONFLICT DO NOTHING
  `;

  // Also swipe right automatically
  await sql`
    INSERT INTO swipes (swiper_character_id, swiped_character_id, direction)
    VALUES (${sender_character_id}, ${receiver_character_id}, 'right')
    ON CONFLICT DO NOTHING
  `;

  // Check for mutual match
  const mutual = await sql`
    SELECT id FROM swipes
    WHERE swiper_character_id = ${receiver_character_id}
    AND swiped_character_id = ${sender_character_id}
    AND direction = 'right'
  `;

  let matched = false;
  let matchId = null;

  if (mutual.length > 0) {
    const a = Math.min(sender_character_id, receiver_character_id);
    const b = Math.max(sender_character_id, receiver_character_id);
    await sql`
      INSERT INTO matches (character_1_id, character_2_id)
      VALUES (${a}, ${b})
      ON CONFLICT DO NOTHING
    `;
    const match = await sql`
      SELECT id FROM matches WHERE character_1_id = ${a} AND character_2_id = ${b}
    `;
    matched = true;
    matchId = match[0]?.id;
  }

  return NextResponse.json({ matched, matchId });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const character_id = searchParams.get('character_id');

  const impressions = await sql`
    SELECT fi.*, c.name as sender_name, c.profile_pic as sender_pic
    FROM first_impressions fi
    JOIN characters c ON fi.sender_character_id = c.id
    WHERE fi.receiver_character_id = ${character_id}
  `;

  return NextResponse.json({ impressions });
}
