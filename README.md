# Teacher's Day Appreciation Board

A Next.js App Router site where students send thank-you notes and professors open a private corkboard of approved sticky notes.

## 1. Create the Next.js app

If you are starting from scratch on your own machine:

```bash
npx create-next-app@14 . --js --tailwind --eslint --app --no-src-dir --import-alias "@/*"
npm install @supabase/supabase-js
```

This repository is already initialized with those packages.

## 2. Create a Supabase project

1. Open [https://supabase.com](https://supabase.com) and create a project.
2. Go to **Project Settings > API**.
3. Copy the **Project URL** and the **anon public** key.

## 3. Add environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_ADMIN_PASSWORD=teachersday2026
```

Change the admin password before sharing the site.

## 4. Run the database SQL

1. In Supabase, open **SQL Editor**.
2. Paste everything from `supabase/schema.sql`.
3. Click **Run**.

That script:

- creates the `professors` and `messages` tables
- disables Row Level Security so this student project can insert and read rows from the frontend
- enables Realtime on `messages`
- inserts three sample professors (`drsmith`, `proflee`, `drpatel` / password `welcome123`)

### If you prefer to keep RLS enabled

Comment out the `disable row level security` lines in `supabase/schema.sql` and uncomment the policy block at the bottom of that file.

You can also turn RLS off from the dashboard:

1. Open **Table Editor**.
2. Select `professors` or `messages`.
3. Click **RLS disabled / enabled** in the table header and choose disabled for this classroom demo.

## 5. Manually add professor logins

1. Open Supabase **Table Editor > professors**.
2. Click **Insert row**.
3. Fill in:

- `username`: the login you will give that professor, for example `drchen`
- `password`: a simple password you create, for example `notes2026`
- `display_name`: what students see in the dropdown, for example `Dr. Chen`

Do not edit `id`. Supabase generates it.

Give each professor their username and password in person or by email.

## 6. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` landing page with Student Portal and Professor Login
- `/student` students pick a professor and submit a pending note
- `/professor` professors log in and see only their approved notes
- `/admin` hidden review desk. Default password is `teachersday2026` unless you set `NEXT_PUBLIC_ADMIN_PASSWORD`

## How the flow works

1. A student submits a note. It is stored with `status = pending`.
2. The admin page listens with Supabase Realtime. A ding and a toast appear when a new row arrives.
3. Approve pins the note on that professor's corkboard. Reject hides it.
4. A professor logs in by matching `username` + `password` in the `professors` table. The session is stored in `localStorage`.
