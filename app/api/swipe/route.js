import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import sql from '@/lib/db';

// True if `gender` satisfies `interestList`. An empty list or a list
// containing 'Everyone' means "open to anyone" — always matches.
function genderMatchesInterest(interestList, gender) {
  if (interestList.length === 0 || interestList.includes('Everyone')) return true;
  if (!gender) return false;
  if (interestList.includes('Men') && gender === 'Man') return true;
  if (interestList.includes('Women') && gender === 'Woman') return true;
  if (interestList.includes('Beyond the binary') && !['Man', 'Woman'].includes(gender)) return true;
  return false;
}

function toInterestList(raw) {
  return Array.isArray(raw) ? raw : (raw ? [raw] : []);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = users[0];

  const myChars = await sql`SELECT * FROM characters WHERE user_id = ${user.id}`;
  const myIds = myChars.map(c => c.id);

  if (myIds.length === 0) return NextResponse.json({ characters: [] });

  const { searchParams } = new URL(req.url);
  const activeId = searchParams.get('character_id');
  const verse = searchParams.get('verse');
  // If the requested character_id doesn't actually belong to this user
  // (stale localStorage, an ID that shifted after a rebuild, anything),
  // fall back to a real owned character instead of silently resolving to
  // undefined. That undefined used to flow into the exclusion query below
  // as `null` — and in SQL, comparing anything to NULL matches nothing,
  // meaning the entire "don't show me people I've already swiped on"
  // exclusion silently did nothing at all. Falling back to a real
  // character here closes that gap for good.
  const requestedChar = activeId ? myChars.find(c => String(c.id) === String(activeId)) : null;
  const activeChar = requestedChar || myChars[0];
  const interestedList = toInterestList(activeChar?.basics?.interested_in);

  let characters = await sql`
    SELECT c.*,
      ARRAY(
        SELECT url FROM character_photos
        WHERE character_id = c.id
        ORDER BY position ASC
      ) as extra_photos
    FROM characters c
    WHERE c.user_id != ${user.id}
    AND c.user_id NOT IN (
      SELECT blocked_user_id FROM blocks WHERE blocker_user_id = ${user.id}
      UNION
      SELECT blocker_user_id FROM blocks WHERE blocked_user_id = ${user.id}
    )
    AND c.id NOT IN (
      SELECT swiped_character_id FROM swipes
      WHERE swiper_character_id = ${activeChar.id}
    )
    ORDER BY RANDOM()
  `;

  const myGender = activeChar?.basics?.gender;

  characters = characters.filter(c => {
    const candidateInterestList = toInterestList(c.basics?.interested_in);
    const iCanSeeThem = genderMatchesInterest(interestedList, c.basics?.gender);
    const theyCanSeeMe = genderMatchesInterest(candidateInterestList, myGender);
    return iCanSeeThem && theyCanSeeMe;
  });

  // Photos hosted on the old Cloudinary account no longer load — hide these
  // characters from everyone else's deck until they re-upload. This applies
  // to both the "All" and "Marvel & DC" tabs equally, since it's checked
  // before the verse split below.
  characters = characters.filter(c => !c.profile_pic || !c.profile_pic.includes('cloudinary.com'));

  if (verse === 'marvel_dc') {
    characters = characters.filter(c => c.basics?.marvel_dc === true);
  } else {
    characters = characters.filter(c => c.basics?.marvel_dc_only !== true);
  }

  // Send a batch of 10 at a time.
  characters = characters.slice(0, 10);

  return NextResponse.json({ characters });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { swiper_character_id, swiped_character_id, direction } = await req.json();

  // The swiping character must belong to the logged-in user.
  const owned = await sql`
    SELECT c.id FROM characters c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ${swiper_character_id} AND u.email = ${session.user.email}
  `;
  if (owned.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await sql`
    INSERT INTO swipes (swiper_character_id, swiped_character_id, direction)
    VALUES (${swiper_character_id}, ${swiped_character_id}, ${direction})
    ON CONFLICT DO NOTHING
  `;

  let matched = false;
  if (direction === 'right') {
    const mutual = await sql`
      SELECT id FROM swipes
      WHERE swiper_character_id = ${swiped_character_id}
      AND swiped_character_id = ${swiper_character_id}
      AND direction = 'right'
    `;
    if (mutual.length > 0) {
      const a = Math.min(swiper_character_id, swiped_character_id);
      const b = Math.max(swiper_character_id, swiped_character_id);
      await sql`
        INSERT INTO matches (character_1_id, character_2_id)
        VALUES (${a}, ${b})
        ON CONFLICT DO NOTHING
      `;
      matched = true;
    }
  }

  if (matched) {
    const matchRecord = await sql`
    SELECT id FROM matches 
    WHERE character_1_id = ${Math.min(swiper_character_id, swiped_character_id)}
    AND character_2_id = ${Math.max(swiper_character_id, swiped_character_id)}
  `;
    return NextResponse.json({ matched, matchId: matchRecord[0]?.id });
  }
  return NextResponse.json({ matched });
}