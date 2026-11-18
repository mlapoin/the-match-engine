import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const myChars = await sql`SELECT id, x_handle FROM characters WHERE user_id = ${user.id}`;
  if (myChars.length === 0) return NextResponse.json({ matches: [], myIds: [] });

  const { searchParams } = new URL(req.url);
  const requestedId = searchParams.get('character_id');
  const activeChar = requestedId
    ? myChars.find(c => String(c.id) === String(requestedId))
    : myChars[0];
  const activeId = activeChar?.id;
  if (!activeId) return NextResponse.json({ matches: [], myIds: [] });

  const matches = await sql`
    SELECT 
      m.id,
      m.created_at,
      c1.id as char1_id, c1.name as char1_name, c1.profile_pic as char1_pic, c1.x_handle as char1_handle,
      c2.id as char2_id, c2.name as char2_name, c2.profile_pic as char2_pic, c2.x_handle as char2_handle,
      lm.content as last_message,
      lm.sender_character_id as last_sender_id,
      lm.created_at as last_message_at,
      lm.read_at as last_message_read_at
    FROM matches m
    JOIN characters c1 ON m.character_1_id = c1.id
    JOIN characters c2 ON m.character_2_id = c2.id
    LEFT JOIN LATERAL (
      SELECT content, sender_character_id, created_at, read_at
      FROM messages
      WHERE match_id = m.id
      ORDER BY created_at DESC
      LIMIT 1
    ) lm ON true
    WHERE m.character_1_id = ${activeId}
    OR m.character_2_id = ${activeId}
    ORDER BY COALESCE(lm.created_at, m.created_at) DESC
  `;

  // One-off testing exception: this viewer sees all their matches
  // regardless of the other person's photo status. Remove this block to
  // go back to the normal behavior for everyone.
  const isExemptViewer = (activeChar?.x_handle || '').toLowerCase() === 'kalapsia_lust';

  // Hide matches where the other person's photo is still a broken
  // Cloudinary link — nothing is deleted, so this reverses itself the
  // moment they re-upload. Skipped entirely for the exempt viewer above.
  const visibleMatches = isExemptViewer ? matches : matches.filter(m => {
    const otherPic = m.char1_id === activeId ? m.char2_pic : m.char1_pic;
    return !otherPic || !otherPic.includes('cloudinary.com');
  });

  return NextResponse.json({ matches: visibleMatches, myIds: [activeId] });
}