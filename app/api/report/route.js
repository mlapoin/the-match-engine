import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { reported_character_id, reason, details } = await req.json();
    if (!reported_character_id || !reason) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    const me = users[0];
    if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const target = await sql`SELECT user_id FROM characters WHERE id = ${reported_character_id}`;
    if (target.length === 0) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    const reportedUserId = target[0].user_id;

    if (Number(reportedUserId) === Number(me.id)) {
      return NextResponse.json({ error: "You can't report your own account." }, { status: 400 });
    }

    await sql`
      INSERT INTO reports (reporter_user_id, reported_user_id, reported_character_id, reason, details)
      VALUES (
        ${me.id},
        ${reportedUserId},
        ${reported_character_id},
        ${String(reason).slice(0, 100)},
        ${details ? String(details).slice(0, 1000) : null}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('report error:', err);
    return NextResponse.json({ error: 'Could not submit report. Please try again.' }, { status: 500 });
  }
}