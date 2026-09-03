# Academic Platform

A multi-tenant attendance, assignments, and grade management system built for
universities and lecturers in Sierra Leone. One codebase, many institutions,
each with its own isolated data.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind) — web app + PWA
- **Supabase** — Postgres database, authentication, row-level security
- Installable on phones as a PWA today; wrappable into iOS/Android app-store
  builds with Capacitor when you're ready (see below)

## Features in this build

- **Attendance** — lecturers open a daily session per course and mark each
  student present, late, excused, or absent
- **Assignments / CA** — lecturers post coursework with a weight and max
  score; running list per course
- **Grades** — CA + exam score compiled per student, with a publish toggle so
  students only see finalized grades
- Role-based access: admin, lecturer, student, registrar
- Every table is scoped by `institution_id` with Postgres row-level security,
  so one deployment safely serves multiple universities

## 1. Set up Supabase

1. Create a free project at supabase.com
2. In the SQL editor, run `supabase/schema.sql` from this repo, it creates
   every table, enum, and row-level security policy
3. In Project Settings then API, copy your Project URL and anon public key

## 2. Configure locally

```bash
cp .env.local.example .env.local
# paste your Supabase URL and anon key into .env.local

npm install
npm run dev
