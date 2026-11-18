import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, age, bio, x_handle, location, profile_pic, looking_for, ship_type, vibe, prompts, lifestyle, basics, interests } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const result = await sql`
    INSERT INTO characters (user_id, name, age, bio, x_handle, location, profile_pic, looking_for, ship_type, vibe, prompts, lifestyle, basics, interests)
    VALUES (${user.id}, ${name}, ${age}, ${bio}, ${x_handle}, ${location}, ${profile_pic}, ${looking_for}, ${ship_type}, ${vibe}, ${JSON.stringify(prompts)}, ${JSON.stringify(lifestyle)}, ${JSON.stringify(basics)}, ${interests})
    RETURNING id
  `;

  return NextResponse.json({ characterId: result[0].id });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const characters = await sql`SELECT * FROM characters WHERE user_id = ${user.id}`;
  return NextResponse.json({ characters });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, age, bio, x_handle, location, profile_pic, looking_for, ship_type, vibe, prompts, lifestyle, basics, interests } = await req.json();
  if (!id || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const result = await sql`
    UPDATE characters
    SET name = ${name}, age = ${age}, bio = ${bio}, x_handle = ${x_handle}, location = ${location}, profile_pic = ${profile_pic},
        looking_for = ${looking_for}, ship_type = ${ship_type}, vibe = ${vibe}, prompts = ${JSON.stringify(prompts)},
        lifestyle = ${JSON.stringify(lifestyle)}, basics = ${JSON.stringify(basics)}, interests = ${interests}
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id
  `;

  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ characterId: result[0].id });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  await sql`DELETE FROM characters WHERE id = ${id} AND user_id = ${user.id}`;
  return NextResponse.json({ success: true });
}