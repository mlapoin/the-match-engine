import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

async function getMe(session) {
  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  return users[0] || null;
}

// Block an entire account, based on any one of its characters.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { blocked_character_id } = await req.json();
    if (!blocked_character_id) {
      return NextResponse.json({ error: 'Missing blocked_character_id' }, { status: 400 });
    }

    const me = await getMe(session);
    if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Resolve the character to the account behind it.
    const target = await sql`SELECT user_id FROM characters WHERE id = ${blocked_character_id}`;
    if (target.length === 0) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    const targetUserId = target[0].user_id;

    if (Number(targetUserId) === Number(me.id)) {
      return NextResponse.json({ error: "You can't block your own account." }, { status: 400 });
    }

    // Record the block. ON CONFLICT keeps a double-tap from erroring.
    await sql`
      INSERT INTO blocks (blocker_user_id, blocked_user_id)
      VALUES (${me.id}, ${targetUserId})
      ON CONFLICT (blocker_user_id, blocked_user_id) DO NOTHING
    `;

    // Tear down every existing match between the two accounts, in both
    // directions, across all of their characters.
    const myChars = await sql`SELECT id FROM characters WHERE user_id = ${me.id}`;
    const theirChars = await sql`SELECT id FROM characters WHERE user_id = ${targetUserId}`;
    const myIds = myChars.map(c => c.id);
    const theirIds = theirChars.map(c => c.id);

    if (myIds.length > 0 && theirIds.length > 0) {
      const doomed = await sql`
        SELECT id FROM matches
        WHERE (character_1_id = ANY(${myIds}::int[]) AND character_2_id = ANY(${theirIds}::int[]))
           OR (character_2_id = ANY(${myIds}::int[]) AND character_1_id = ANY(${theirIds}::int[]))
      `;
      const matchIds = doomed.map(m => m.id);
      if (matchIds.length > 0) {
        await sql`DELETE FROM messages WHERE match_id = ANY(${matchIds}::int[])`;
        await sql`DELETE FROM matches WHERE id = ANY(${matchIds}::int[])`;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('block error:', err);
    return NextResponse.json({ error: 'Could not block. Please try again.' }, { status: 500 });
  }
}

// Unblock an account.
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const blockedUserId = searchParams.get('user_id');
    if (!blockedUserId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const me = await getMe(session);
    if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await sql`
      DELETE FROM blocks
      WHERE blocker_user_id = ${me.id} AND blocked_user_id = ${blockedUserId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('unblock error:', err);
    return NextResponse.json({ error: 'Could not unblock.' }, { status: 500 });
  }
}

// List accounts I've blocked.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const me = await getMe(session);
    if (!me) return NextResponse.json({ blocked: [] });

    const blocked = await sql`
      SELECT b.blocked_user_id,
             b.created_at,
             ARRAY(
               SELECT name FROM characters WHERE user_id = b.blocked_user_id
             ) AS character_names
      FROM blocks b
      WHERE b.blocker_user_id = ${me.id}
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json({ blocked });
  } catch (err) {
    console.error('list blocks error:', err);
    return NextResponse.json({ blocked: [] });
  }
}