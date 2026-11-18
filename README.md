# Match Engine

A swipe-to-match web app I designed, built, and launched solo for a client in one month.
People create profiles, swipe on each other, match when the interest is mutual, and chat with their matches.

> **Status:** Ran as a one-month event and is now offline. This repo is a cleaned copy of the production code, with personal details, branding, and private assets removed.

<!-- Add a screenshot or GIF here, e.g. ![Match Engine swipe screen](docs/swipe.png) -->

---

## Highlights

- **7,100+ users** during its one-month run
- Built, deployed, and maintained by one developer
- Survived a traffic spike that exceeded the database's free-tier limits (see [Performance fixes](#performance-fixes))

## Features

- **Swipe deck** with drag and button controls. The next profile is always rendered underneath the current one, so there's never a blank moment between swipes.
- **Mutual matching.** A match only forms when both people swipe right on each other.
- **Likes tab** showing who liked you, with the option to like them back or pass.
- **Chat** between matches, with read receipts.
- **Profiles** with multiple photos, prompts, interests, and a full-screen profile view.
- **Two-way filters.** Your preferences decide who you see *and* who can see you.
- **Safety tools:** block an account (hides both sides and removes matches), report a profile, and account-level bans.
- **Auth:** email sign-up with verification, login, password reset, and change password.
- **Installable** as a home-screen web app (PWA manifest).

## Tech stack

| Tool | Used for |
|---|---|
| [Next.js](https://nextjs.org) (App Router) | Pages and API routes |
| TypeScript / JavaScript | App code |
| [Neon](https://neon.tech) Postgres | Users, profiles, swipes, matches, messages |
| [NextAuth](https://next-auth.js.org) | Credentials login and sessions |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Profile photo storage |
| [Resend](https://resend.com) | Verification and password-reset emails |
| [Vercel](https://vercel.com) | Hosting and deploys |
| Tailwind CSS + inline styles | Styling |

## Project structure

```
app/
  api/                 API routes (auth, swipe, matches, messages, likes, block, report, upload, ...)
  swipe/               Swipe deck
  likes/               People who liked you
  chat/                Match list and chat threads (chat/[id])
  profile/             Your profile and settings entry point
  create-character/    Profile creation
  edit-character/      Profile editing
  character/[id]/      Shareable, members-only profile pages
  components/          BottomNav, ProfileSheet, PhotoManager, HouseRules
  login/ signup/ forgot-password/ reset-password/ settings/
lib/
  db.js                Neon SQL client
public/                Icons and PWA manifest
```

## Data model

The app uses these Postgres tables:

| Table | Holds |
|---|---|
| `users` | Accounts, password hashes, verification and reset tokens, ban status |
| `characters` | Profiles (one account can have more than one), bio, prompts, preferences |
| `character_photos` | Extra profile photos |
| `swipes` | Every left/right swipe |
| `matches` | Pairs who both swiped right |
| `messages` | Chat messages, with `read_at` for read receipts |
| `blocks` | Account-level blocks |
| `reports` | User reports for review |
| `first_impressions` | Opening messages sent with a like |

The SQL schema isn't included in this repo.

## Performance fixes

After launch, traffic pushed the app past the database's usage limits. The cause was the chat screens polling the database every 3 seconds, around the clock, including a read-receipt write on every poll. The fix:

1. **Pause polling when the tab is hidden**, and refresh immediately when it becomes visible again.
2. **Poll less often:** the match list every 15s, an open chat every 5s.
3. **Only mark messages as read when something is actually unread**, removing a constant write.
4. **Rewrite the matches query** from five repeated subqueries into a single `LEFT JOIN LATERAL`.

A forgotten open tab went from about 40 database calls a minute to zero.

## Running it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Create a `.env.local` file with:

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign sessions |
| `NEXTAUTH_URL` | Yes | Base URL of the app (used in email links) |
| `RESEND_API_KEY` | Yes | Sending verification and reset emails |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob photo uploads |
| `EMAIL_FROM` | No | Sender address (defaults to Resend's test sender) |
| `NEXT_PUBLIC_SITE_URL` | No | Public URL for metadata |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics ID (analytics only load if set) |

You'll also need to create the tables listed above in your Postgres database.

## What I'd change

I'd plan for scale from day one. Checking for new messages every few seconds worked for a demo, but not for 7,100 people.
