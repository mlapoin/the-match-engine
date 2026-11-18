import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const myChars = await sql`SELECT id FROM characters WHERE user_id = ${user.id}`;
  if (myChars.length === 0) return NextResponse.json({ likes: [] });

  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get('character_id');
  const activeId = requestedId
    ? myChars.find(c => String(c.id) === String(requestedId))?.id
    : myChars[0].id;
  if (!activeId) return NextResponse.json({ likes: [] });

  const likes = await sql`
    SELECT
      s.swiper_character_id,
      s.created_at,
      c.name, c.age, c.bio, c.x_handle, c.location, c.profile_pic
    FROM swipes s
    JOIN characters c ON s.swiper_character_id = c.id
    WHERE s.swiped_character_id = ${activeId}
    AND s.direction = 'right'
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_user_id = ${user.id} AND b.blocked_user_id = c.user_id)
         OR (b.blocked_user_id = ${user.id} AND b.blocker_user_id = c.user_id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM swipes already
      WHERE already.swiper_character_id = ${activeId}
      AND already.swiped_character_id = s.swiper_character_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM matches
      WHERE (character_1_id = s.swiper_character_id AND character_2_id = ${activeId})
      OR (character_2_id = s.swiper_character_id AND character_1_id = ${activeId})
    )
    AND (c.profile_pic IS NULL OR c.profile_pic NOT LIKE '%cloudinary.com%')
    ORDER BY s.created_at DESC
  `;

  return NextResponse.json({ likes });
}