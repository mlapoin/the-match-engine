import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function GET(req, context) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const rows = await sql`
    SELECT c.*,
      ARRAY(
        SELECT url FROM character_photos
        WHERE character_id = c.id
        ORDER BY position ASC
      ) as extra_photos
    FROM characters c
    WHERE c.id = ${id}
  `;

  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ character: rows[0] });
}
