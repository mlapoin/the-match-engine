import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('character_id');
  if (!characterId) return NextResponse.json({ error: 'Missing character_id' }, { status: 400 });

  const photos = await sql`
    SELECT * FROM character_photos
    WHERE character_id = ${characterId}
    ORDER BY position ASC
  `;

  return NextResponse.json({ photos });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { character_id, url, position } = await req.json();

  // Only add photos to a character you own.
  const owned = await sql`
    SELECT c.id FROM characters c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ${character_id} AND u.email = ${session.user.email}
  `;
  if (owned.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await sql`
    INSERT INTO character_photos (character_id, url, position)
    VALUES (${character_id}, ${url}, ${position})
    RETURNING *
  `;

  return NextResponse.json({ photo: result[0] });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();

  // Only delete a photo that hangs off one of your own characters.
  const owned = await sql`
    SELECT p.id FROM character_photos p
    JOIN characters c ON p.character_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE p.id = ${id} AND u.email = ${session.user.email}
  `;
  if (owned.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await sql`DELETE FROM character_photos WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
